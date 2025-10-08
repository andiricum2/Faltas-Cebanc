#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Context;
use std::{
    path::PathBuf,
    process::{Command, Stdio},
    sync::Mutex,
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
use tauri_plugin_opener::OpenerExt;

// Estructura para mantener el estado gestionado, incluyendo el proceso sidecar.
struct AppState {
    sidecar_process: Mutex<Option<std::process::Child>>,
}

/// Espera a que un servidor TCP en el host y puerto especificados esté disponible.
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

/// Inicia el servidor Next.js como un proceso sidecar.
#[cfg(not(debug_assertions))]
fn spawn_next_sidecar(app: &AppHandle) -> anyhow::Result<Option<(std::process::Child, u16)>> {
    // Busca el ejecutable de Next.js en los recursos de la aplicación.
    let resource_dir = app.path().resource_dir()?;
    let standalone_dir = resource_dir.join("next").join("standalone");
    let server_js = standalone_dir.join("server.js");
    if !server_js.exists() {
        // Si no existe, probablemente estamos en desarrollo.
        return Ok(None);
    }

    // Resuelve la ruta al ejecutable de Node.js empaquetado.
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
    let preferred_port: u16 = 34425;
    let port: u16 = match std::net::TcpListener::bind((host, preferred_port)) {
        Ok(listener) => {
            let _ = listener.local_addr();
            drop(listener);
            preferred_port
        }
        Err(_) => 3000,
    };

    let mut cmd = Command::new(node_path);
    cmd.current_dir(&standalone_dir)
        .stdin(Stdio::null())
        .env("PORT", format!("{}", port))
        .env("NODE_ENV", "production")
        .env("HOSTNAME", host)
        .arg("server.js");

    // En desarrollo, los logs van a la consola. En producción, a un archivo.
    #[cfg(debug_assertions)]
    {
        cmd.stdout(Stdio::inherit()).stderr(Stdio::inherit());
    }
    #[cfg(not(debug_assertions))]
    {
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    }

    // En Windows, evita que se abra una ventana de consola para el proceso de Node.
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let mut child = cmd.spawn().context("failed to spawn next sidecar")?;

    // Redirige stdout y stderr del proceso sidecar a un archivo de log en producción.
    #[cfg(not(debug_assertions))]
    {
        if let Ok(log_dir) = app.path().app_data_dir() {
            let _ = std::fs::create_dir_all(&log_dir);
            let log_path = log_dir.join("next-standalone.log");
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

    // Espera a que el servidor esté listo antes de continuar.
    wait_for_server(host, port, 20000);

    Ok(Some((child, port)))
}

#[tauri::command]
fn ready(_app: AppHandle) {}

#[tauri::command]
async fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .opener()
            .open_url(url, None::<String>)
            .map_err(|e| format!("Failed to open external URL: {}", e))
    } else {
        Err("Main window not found".to_string())
    }
}

fn main() {
    // Construye la app primero para poder manejar eventos de salida correctamente.
    let app = tauri::Builder::default()
        // Registra el estado gestionado para que sea accesible en toda la app.
        .manage(AppState { sidecar_process: Mutex::new(None) })
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            // La configuración se ejecuta al iniciar la aplicación.
            #[cfg(not(debug_assertions))]
            {
                // Solo en producción, inicia el sidecar.
                if let Ok(Some((child, port))) = spawn_next_sidecar(&_app.handle()) {
                    // Guarda el handle del proceso en el estado gestionado.
                    let state = _app.state::<AppState>();
                    *state.sidecar_process.lock().unwrap() = Some(child);

                    // Navega la ventana principal a la URL del servidor Next.js.
                    let url = Url::parse(&format!("http://127.0.0.1:{}", port)).unwrap();
                    if let Some(win) = _app.get_webview_window("main") {
                        let _ = win.navigate(url);
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ready, open_external_url])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // Maneja el cierre de la aplicación y limpia el proceso sidecar.
    use tauri::RunEvent;
    app.run(|app_handle, event| match event {
        RunEvent::ExitRequested { .. } | RunEvent::Exit => {
            let state = app_handle.state::<AppState>();
            if let Some(mut child) = state.sidecar_process.lock().unwrap().take() {
                if let Err(e) = child.kill() {
                    eprintln!("Failed to kill sidecar process: {}", e);
                }
            }
        }
        _ => {}
    });
}