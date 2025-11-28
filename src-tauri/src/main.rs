#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod logging;
mod sidecar;
mod commands;

use tauri::{Manager, RunEvent, WindowEvent, AppHandle};

fn terminate_sidecar(app_handle: &AppHandle) {
	let state = app_handle.state::<state::AppState>();
	if let Some(mut child) = state.sidecar_process.lock().unwrap().take() {
		logging::log_sidecar_exit(app_handle);
		if let Err(e) = child.kill() {
			logging::log_sidecar_error(app_handle, &format!("Failed to kill sidecar process: {}", e));
		} else {
			logging::log_info(app_handle, "Sidecar process terminated successfully");
		}
	}
}

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
					logging::log_info(&_app.handle(), &format!("Sidecar process spawned successfully on port {}", port));

					if let Some(win) = _app.get_webview_window("main") {
						let url = url::Url::parse(&format!("http://127.0.0.1:{}", port)).unwrap();
						let _ = win.navigate(url);
						logging::log_info(&_app.handle(), "Navigated to sidecar URL");
					}
				} else {
					logging::log_sidecar_error(&_app.handle(), "Failed to spawn sidecar process");
				}
			}
			Ok(())
		})
    	.invoke_handler(tauri::generate_handler![commands::ready, commands::open_external_url, commands::log_client])
		.build(tauri::generate_context!())
		.expect("error while building tauri application");

	app.run(|app_handle, event| match event {
		RunEvent::WindowEvent { label: _, event: WindowEvent::CloseRequested { api, .. }, .. } => {
			api.prevent_close();
			terminate_sidecar(&app_handle);
			logging::log_app_exit(&app_handle);
			app_handle.exit(0);
		},
		RunEvent::WindowEvent { event: WindowEvent::Destroyed, .. } => {
			terminate_sidecar(&app_handle);
		},
		RunEvent::ExitRequested { .. } | RunEvent::Exit => {
			terminate_sidecar(&app_handle);
			logging::log_app_exit(&app_handle);
		},
		_ => {}
	});
}