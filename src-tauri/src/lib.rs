mod commands;

use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

/// Holds file paths that should be opened by newly created windows.
/// Keyed by window label; the new window pops its entry on startup.
pub struct PendingFiles(pub Mutex<HashMap<String, String>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(PendingFiles(Mutex::new(HashMap::new())))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // Called when a second launch attempt is made (e.g. double-clicking a .md file
            // while Folio is already running). Extract the file path from argv and emit it
            // to the frontend so the existing window can open it.
            if let Some(path) = argv.iter().skip(1).find(|a| {
                !a.starts_with('-') && (a.ends_with(".md") || a.ends_with(".markdown"))
            }) {
                app.emit("open-file-request", path).ok();
            }
            // Bring the existing window to the front.
            if let Some(window) = app.get_webview_window("main") {
                window.set_focus().ok();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            commands::file::read_file,
            commands::file::open_file_dialog,
            commands::file::get_cli_file,
            commands::file::open_new_window,
            commands::file::take_pending_file,
            commands::file::set_fullscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
