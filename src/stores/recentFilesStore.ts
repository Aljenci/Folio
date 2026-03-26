import { Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";

const MAX_RECENT = 20;
const STORE_KEY = "recent_files";

// Lazy singleton — Store.load() is async so we initialize on first use.
let _diskStore: Store | null = null;
async function getStore(): Promise<Store> {
  if (!_diskStore) _diskStore = await Store.load("folio-settings.json");
  return _diskStore;
}

export interface RecentFile {
  /** Full absolute path: '/home/user/notes/README.md' */
  path: string;
  /** Filename only: 'README.md' */
  name: string;
  /** Unix timestamp in milliseconds */
  openedAt: number;
}

interface RecentFilesState {
  files: RecentFile[];
  /** Whether we have attempted to read from disk yet */
  isLoaded: boolean;

  loadFromDisk: () => Promise<void>;
  add: (path: string) => Promise<void>;
  remove: (path: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useRecentFilesStore = create<RecentFilesState>((set, get) => ({
  files: [],
  isLoaded: false,

  loadFromDisk: async () => {
    try {
      const store = await getStore();
      const stored = await store.get<RecentFile[]>(STORE_KEY);
      set({ files: stored ?? [], isLoaded: true });
    } catch (e) {
      console.warn("Recent files store corrupted, resetting to defaults:", e);
      try {
        const store = await getStore();
        await store.delete(STORE_KEY);
        await store.save();
      } catch {
        // Ignore secondary errors during corruption recovery
      }
      set({ files: [], isLoaded: true });
    }
  },

  add: async (path: string) => {
    // Extract filename from full path (handles both / and \ separators).
    const name = path.split(/[/\\]/).pop() ?? path;
    const newEntry: RecentFile = { path, name, openedAt: Date.now() };

    // Prepend, deduplicate by path, and trim to max length.
    const updated = [
      newEntry,
      ...get().files.filter((f) => f.path !== path),
    ].slice(0, MAX_RECENT);

    set({ files: updated });

    const store = await getStore();
    await store.set(STORE_KEY, updated);
    await store.save();
  },

  remove: async (path: string) => {
    const updated = get().files.filter((f) => f.path !== path);
    set({ files: updated });
    const store = await getStore();
    await store.set(STORE_KEY, updated);
    await store.save();
  },

  clear: async () => {
    set({ files: [] });
    const store = await getStore();
    await store.delete(STORE_KEY);
    await store.save();
  },
}));
