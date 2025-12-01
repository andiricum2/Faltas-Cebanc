use anyhow::Context;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::AppHandle;
use tauri::Manager;

use crate::logging;

#[cfg(not(debug_assertions))]
fn wait_for_server(host: &str, port: u16, total_timeout_ms: u64) -> bool {
	let deadline = std::time::Instant::now() + std::time::Duration::from_millis(total_timeout_ms);
	while std::time::Instant::now() < deadline {
		if let Ok(stream) = std::net::TcpStream::connect((host, port)) {
			let _ = stream.shutdown(std::net::Shutdown::Both);
			return true;
		}
		std::thread::sleep(std::time::Duration::from_millis(200));
	}
	false
}

#[cfg(not(debug_assertions))]
pub fn spawn_next_sidecar(app: &AppHandle) -> anyhow::Result<Option<(std::process::Child, u16)>> {
	let resource_dir = app.path().resource_dir()?;
	let standalone_dir = resource_dir.join("next").join("standalone");
	let server_js = standalone_dir.join("server.js");
	if !server_js.exists() {
		return Ok(None);
	}

	let node_path: PathBuf = {
		#[cfg(target_os = "windows")]
		{ resource_dir.join("bin").join("node.exe") }
		#[cfg(not(target_os = "windows"))]
		{ resource_dir.join("bin").join("node") }
	};

	let host = "127.0.0.1";
	let port: u16 = 34425;

	let app_data_dir = app
		.path()
		.app_data_dir()
		.unwrap_or_else(|_| resource_dir.join("data"));
	let cache_dir = app
		.path()
		.app_cache_dir()
		.unwrap_or_else(|_| resource_dir.join("cache"));
	let _ = fs::create_dir_all(&app_data_dir);
	let _ = fs::create_dir_all(&cache_dir);

	let mut cmd = Command::new(node_path);
	cmd.current_dir(&standalone_dir)
		.stdin(Stdio::null())
		.env("PORT", format!("{}", port))
		.env("NODE_ENV", "production")
		.env("HOSTNAME", host)
		.env("APP_DATA_DIR", app_data_dir.as_os_str())
		.env("NEXT_CACHE_DIR", cache_dir.as_os_str())
		.arg("server.js");

	#[cfg(debug_assertions)]
	{
		cmd.stdout(Stdio::inherit()).stderr(Stdio::inherit());
	}
	#[cfg(not(debug_assertions))]
	{
		cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
	}

	#[cfg(target_os = "windows")]
	{
		use std::os::windows::process::CommandExt;
		cmd.creation_flags(0x08000000);
	}

	logging::log_sidecar_start(app, port);
	let mut child = cmd.spawn().context("failed to spawn next sidecar")
		.map_err(|e| {
			logging::log_sidecar_error(app, &format!("Failed to spawn sidecar: {}", e));
			e
		})?;

	#[cfg(not(debug_assertions))]
	{
		// Capture stdout/stderr into log file
		let app_handle_for_stdout = app.clone();
		if let Some(stdout) = child.stdout.take() {
			std::thread::spawn(move || {
				use std::io::{BufRead, BufReader};
				let reader = BufReader::new(stdout);
				for line in reader.lines() {
					if let Ok(line) = line { logging::log_info(&app_handle_for_stdout, &format!("sidecar stdout: {}", line)); }
				}
			});
		}
		let app_handle_for_stderr = app.clone();
		if let Some(stderr) = child.stderr.take() {
			std::thread::spawn(move || {
				use std::io::{BufRead, BufReader};
				let reader = BufReader::new(stderr);
				for line in reader.lines() {
					if let Ok(line) = line { logging::log_error(&app_handle_for_stderr, &format!("sidecar stderr: {}", line)); }
				}
			});
		}
	}

	wait_for_server(host, port, 20000);
	logging::log_sidecar_ready(app, host, port);

	Ok(Some((child, port)))
}


