use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn ready(_app: AppHandle) {}

#[tauri::command]
pub async fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
	if let Some(window) = app.get_webview_window("main") {
		window
			.opener()
			.open_url(url, None::<String>)
			.map_err(|e| format!("Failed to open external URL: {}", e))
	} else {
		Err("Main window not found".to_string())
	}
}


