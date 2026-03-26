use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Maximum allowed file size: 10 MB.
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

/// Read a file from the given absolute path.
///
/// Returns the UTF-8 file contents on success, or a descriptive error string
/// on failure (file not found, too large, non-UTF-8, I/O error).
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(&path);

    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }

    let metadata = std::fs::metadata(&file_path)
        .map_err(|e| format!("Cannot read file metadata: {}", e))?;

    if metadata.len() > MAX_FILE_SIZE {
        return Err(format!(
            "File too large: {} bytes (max {} bytes)",
            metadata.len(),
            MAX_FILE_SIZE
        ));
    }

    std::fs::read_to_string(&file_path).map_err(|e| {
        // Provide a clear message for encoding errors
        let msg = e.to_string();
        if msg.contains("invalid utf-8") || msg.contains("stream did not contain valid UTF-8") {
            format!("File is not valid UTF-8 text: {}", path)
        } else {
            format!("Failed to read file: {}", e)
        }
    })
}

/// Open a native file-picker dialog filtered to Markdown files.
///
/// Returns the chosen absolute path, or `null` if the user cancelled.
/// Declared `async` so it runs on the thread-pool and never blocks the main thread.
#[tauri::command]
pub async fn open_file_dialog(app: AppHandle) -> Result<Option<String>, String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter(
            "Markdown",
            &["md", "markdown", "MD", "MARKDOWN", "Md", "Markdown"],
        )
        .blocking_pick_file();

    Ok(file_path.map(|p| p.to_string()))
}

/// Returns the first command-line argument that looks like a Markdown file path.
///
/// Called once on startup to check whether the user launched Folio by passing a
/// file path directly (e.g. `folio README.md` in the terminal).
///
/// Returns Some(path) if a Markdown file was found in the arguments.
/// Returns None if the app was launched without a file argument.
#[tauri::command]
pub fn get_cli_file() -> Option<String> {
    std::env::args()
        .skip(1) // Skip the executable path at index 0
        .find(|arg| {
            // Skip flags (arguments beginning with '-') such as --help, --version.
            if arg.starts_with('-') {
                return false;
            }
            // Accept .md and .markdown extensions (case-sensitive; covers common usage).
            arg.ends_with(".md") || arg.ends_with(".markdown")
        })
}

/// Opens a new application window, optionally with a file pre-loaded.
///
/// Must be `async` so the command runs on the Tokio thread pool rather than
/// the main thread. On Windows, IPC handlers fire on the main thread.
/// `build()` internally calls `run_on_main_thread()` and blocks waiting for
/// the main thread to create the window — if we are already on the main thread,
/// that inner `run_on_main_thread` posts to the message queue and we block
/// waiting for ourselves: deadlock. Running `build()` from a Tokio thread
/// avoids this because the main thread stays free to service the queue.
#[tauri::command]
pub async fn open_new_window(
    app: tauri::AppHandle,
    path: Option<String>,
) -> tauri::Result<()> {
    let label = format!(
        "folio-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    // Access PendingFiles state synchronously before any async boundary.
    if let Some(ref p) = path {
        let state = app.state::<crate::PendingFiles>();
        if let Ok(mut map) = state.0.lock() {
            map.insert(label.clone(), p.clone());
        };  // semicolon drops the MutexGuard temporary before `state` is dropped
    }

    let app_clone = app.clone();
    let label_clone = label.clone();

    // Spawn onto Tokio so build() can safely block the worker thread while
    // the main thread creates the window. The spawn itself returns immediately,
    // so the async command handler (and the IPC response) complete before
    // the window is fully constructed.
    tauri::async_runtime::spawn(async move {
        let _ = tauri::WebviewWindowBuilder::new(
            &app_clone,
            &label_clone,
            tauri::WebviewUrl::App(std::path::PathBuf::new()),
        )
        .title("Folio")
        .inner_size(1200.0, 800.0)
        .min_inner_size(600.0, 400.0)
        .visible(false)
        .build();
    });

    Ok(())
}

/// Retrieves and removes the pending file path for a given window label.
///
/// Called by a newly opened window on startup to check whether it was
/// opened with a specific file to display.
#[tauri::command]
pub fn take_pending_file(
    label: String,
    state: tauri::State<'_, crate::PendingFiles>,
) -> Option<String> {
    state.0.lock().ok()?.remove(&label)
}

/// Sets the native OS fullscreen state on the calling window.
///
/// Accepts an explicit `fullscreen` bool so the caller (JS side) owns the
/// toggle state — this avoids relying on `is_fullscreen()` which is
/// unreliable on Windows in development mode.
#[tauri::command]
pub fn set_fullscreen(window: tauri::WebviewWindow, fullscreen: bool) -> tauri::Result<()> {
    window.set_fullscreen(fullscreen)
}
