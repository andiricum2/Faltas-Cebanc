use tauri::AppHandle;
use tauri::Manager;

fn write_line(app: &AppHandle, level: &str, message: &str) {
	#[cfg(debug_assertions)]
	{
		println!("[{}] {}", level, message);
	}
	#[cfg(not(debug_assertions))]
	{
		if let Ok(app_log_dir) = app.path().app_log_dir() {
			let _ = std::fs::create_dir_all(&app_log_dir);
			let log_file = app_log_dir.join("sidecar.log");
			if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(log_file) {
				use std::io::Write;
				let _ = writeln!(file, "[{}] {}", level, message);
			}
		}
	}
}

pub fn log_info(app: &AppHandle, msg: &str) {
	write_line(app, "INFO", msg);
}

pub fn log_error(app: &AppHandle, msg: &str) {
	write_line(app, "ERROR", msg);
}

pub fn log_app_start(app: &AppHandle) {
	log_info(app, "App starting");
}

pub fn log_app_exit(app: &AppHandle) {
	log_info(app, "App exiting");
}

pub fn log_sidecar_start(app: &AppHandle, port: u16) {
	log_info(app, &format!("Sidecar process starting on port {}", port));
}

pub fn log_sidecar_ready(app: &AppHandle, host: &str, port: u16) {
	log_info(app, &format!("Sidecar process ready at http://{}:{}", host, port));
}

pub fn log_sidecar_exit(app: &AppHandle) {
	log_info(app, "Sidecar process exiting");
}

pub fn log_sidecar_error(app: &AppHandle, error: &str) {
	log_error(app, &format!("Sidecar error: {}", error));
}


