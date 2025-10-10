#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod logging;
mod sidecar;
mod commands;

use tauri::Manager;

fn main() {
	let app = tauri::Builder::default()
		.manage(state::AppState::default())
		.plugin(tauri_plugin_opener::init())
		.setup(|_app| {
			logging::log_app_start(&_app.handle());
			#[cfg(not(debug_assertions))]
			{
				if let Ok(Some((child, port))) = sidecar::spawn_next_sidecar(&_app.handle()) {
					let state = _app.state::<state::AppState>();
					*state.sidecar_process.lock().unwrap() = Some(child);

					if let Some(win) = _app.get_webview_window("main") {
						let url = url::Url::parse(&format!("http://127.0.0.1:{}", port)).unwrap();
						let _ = win.navigate(url);
					}
				}
			}
			Ok(())
		})
    	.invoke_handler(tauri::generate_handler![commands::ready, commands::open_external_url, commands::log_client])
		.build(tauri::generate_context!())
		.expect("error while building tauri application");

	use tauri::RunEvent;
	app.run(|app_handle, event| match event {
		RunEvent::ExitRequested { .. } | RunEvent::Exit => {
			let state = app_handle.state::<state::AppState>();
			if let Some(mut child) = state.sidecar_process.lock().unwrap().take() {
				if let Err(e) = child.kill() {
					logging::log_error(&app_handle, &format!("Failed to kill sidecar process: {}", e));
				}
			}
			logging::log_app_exit(&app_handle);
		}
		_ => {}
	});
}