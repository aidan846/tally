use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Open as a true square (including Tally's custom title bar), then
            // let the normal resizable window controls take over.
            if let Some(window) = app.get_webview_window("main") {
                window.set_size(tauri::LogicalSize::new(360.0, 360.0))?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Tally");
}
