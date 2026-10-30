use tauri::Manager;

/// The CPU architecture this build of Tally was compiled for ("aarch64",
/// "x86_64", "x86"). Used to pick the matching installer when updating.
#[tauri::command]
fn app_arch() -> &'static str {
    std::env::consts::ARCH
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![app_arch])
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
