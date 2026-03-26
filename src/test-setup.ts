import "@testing-library/jest-dom";

// Mock Tauri IPC so tests never attempt real inter-process calls
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

// Mock the Tauri persistent store plugin — provides an in-memory store
// so store unit tests run without a real Tauri binary.
vi.mock("@tauri-apps/plugin-store", () => {
  const data = new Map<string, unknown>();
  const mockStore = {
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { data.set(key, value); }),
    delete: vi.fn(async (key: string) => { data.delete(key); }),
    save: vi.fn(async () => {}),
    clear: vi.fn(async () => { data.clear(); }),
  };
  return {
    Store: {
      load: vi.fn(async () => mockStore),
    },
  };
});
