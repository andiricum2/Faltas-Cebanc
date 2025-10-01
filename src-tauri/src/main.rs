#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Context;
use std::{
    path::PathBuf,
    process::{Command, Stdio},
};
#[cfg(not(debug_assertions))]
use std::{
    fs::OpenOptions,
    io::{Read, Write},
    thread,
};
#[cfg(not(debug_assertions))]
use url::Url;
use tauri::{AppHandle, Manager};

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
fn spawn_next_sidecar(app: &AppHandle) -> anyhow::Result<Option<(std::process::Child, u16)>> {
    let resource_dir = app.path().resource_dir()?;
    // Use resources/next/standalone (mirrored from project .next/standalone at build time)
    let standalone_dir = resource_dir.join("next").join("standalone");
    let server_js = standalone_dir.join("server.js");
    if !server_js.exists() {
        // Nothing to spawn; likely running in dev which uses devUrl
        return Ok(None);
    }

    // Resolve bundled node from resources/bin
    let node_path: PathBuf = {
        #[cfg(target_os = "windows")]
        {
            resource_dir.join("bin").join("node.exe")
        }
        #[cfg(not(target_os = "windows"))]
        {
            resource_dir.join("bin").join("node")
        }
    };

    let host = "127.0.0.1";
    // Pick an available random port
    let port: u16 = {
        match std::net::TcpListener::bind((host, 0)) {
            Ok(listener) => {
                let chosen = listener.local_addr().ok().map(|a| a.port()).unwrap_or(3000);
                drop(listener);
                if chosen == 0 { 3000 } else { chosen }
            }
            Err(_) => 3000,
        }
    };

    let mut cmd = Command::new(node_path);
    cmd.current_dir(&standalone_dir)
        .stdin(Stdio::null())
        .env("PORT", format!("{}", port))
        .env("NODE_ENV", "production")
        .env("HOSTNAME", host)
        .arg("server.js");

    // In dev: inherit stdio so logs appear in terminal. In prod: pipe to log file.
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
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let mut child = cmd.spawn().context("failed to spawn next sidecar")?;

    // In production builds, persist Next.js stdout/stderr to a log file
    #[cfg(not(debug_assertions))]
    {
        if let Ok(log_dir) = app.path().app_data_dir() {
            let _ = std::fs::create_dir_all(&log_dir);
            let log_path = log_dir.join("next-standalone.log");
            // stdout
            if let Some(mut out) = child.stdout.take() {
                let log_path_clone = log_path.clone();
                thread::spawn(move || {
                    let mut buf = [0u8; 8192];
                    let mut file = OpenOptions::new().create(true).append(true).open(&log_path_clone).ok();
                    while let Ok(n) = out.read(&mut buf) {
                        if n == 0 { break; }
                        if let Some(f) = file.as_mut() {
                            let _ = f.write_all(&buf[..n]);
                        }
                    }
                });
            }
            // stderr
            if let Some(mut err) = child.stderr.take() {
                thread::spawn(move || {
                    let mut buf = [0u8; 8192];
                    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&log_path) {
                        while let Ok(n) = err.read(&mut buf) {
                            if n == 0 { break; }
                            let _ = file.write_all(&buf[..n]);
                        }
                    }
                });
            }
        }
    }

    // Wait until server responds before loading
    let ready = wait_for_server(host, port, 20000);
    if !ready {
        // Continue anyway; the window load will retry internally via web stack
    }

    Ok(Some((child, port)))
}

#[tauri::command]
fn ready(_app: AppHandle) {}

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // En producción, lanzar servidor y navegar cuando esté listo
            #[cfg(not(debug_assertions))]
            {
                let launched = spawn_next_sidecar(&_app.handle()).ok().flatten();
                let port = launched.as_ref().map(|(_, p)| *p).unwrap_or(3000);
                let url = Url::parse(&format!("http://127.0.0.1:{}", port)).unwrap();
                if let Some(win) = _app.get_webview_window("main") {
                    let _ = win.navigate(url);
                } else if let Some(win) = _app.webview_windows().values().next() {
                    let _ = win.navigate(url);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ready])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


