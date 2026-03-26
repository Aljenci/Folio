import { invoke } from "@tauri-apps/api/core";
import { useRecentFilesStore, type RecentFile } from "../../stores/recentFilesStore";
import { useDocumentStore } from "../../stores/documentStore";

interface Props {
  onOpen: (path: string, content: string) => void;
}

export function WelcomeScreen({ onOpen }: Props) {
  const { files: recentFiles, remove } = useRecentFilesStore();

  // Opens the native OS file picker.
  const handleOpenDialog = async () => {
    try {
      const path = await invoke<string | null>("open_file_dialog");
      if (!path) return;
      const content = await invoke<string>("read_file", { path });
      onOpen(path, content);
    } catch (e) {
      useDocumentStore.getState().setError(String(e));
    }
  };

  // Opens a file from the recent list.
  // If the file no longer exists, removes it from the list gracefully.
  const handleOpenRecent = async (path: string) => {
    try {
      const content = await invoke<string>("read_file", { path });
      onOpen(path, content);
    } catch {
      await remove(path);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="welcome">
      <div className="welcome__hero">
        <h1 className="welcome__app-name">Folio</h1>
        <p className="welcome__tagline">A beautiful Markdown reader</p>
      </div>

      <button className="welcome__open-btn" onClick={() => { void handleOpenDialog(); }}>
        Open a file
      </button>
      <p className="welcome__hint">
        or drag and drop any <code>.md</code> file onto this window
      </p>

      {recentFiles.length > 0 && (
        <section className="welcome__recent">
          <h2 className="welcome__recent-title">Recent files</h2>
          <ul className="recent-list">
            {recentFiles.map((file: RecentFile) => (
              <li key={file.path} className="recent-list__item">
                <button
                  className="recent-list__btn"
                  onClick={() => { void handleOpenRecent(file.path); }}
                  title={file.path}
                >
                  <span className="recent-list__name">{file.name}</span>
                  <span className="recent-list__meta">
                    <span className="recent-list__path">{file.path}</span>
                    <span className="recent-list__date">{formatDate(file.openedAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
