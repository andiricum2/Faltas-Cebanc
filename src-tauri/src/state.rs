use std::process::Child;
use std::sync::Mutex;

pub struct AppState {
	pub sidecar_process: Mutex<Option<Child>>,
}

impl Default for AppState {
	fn default() -> Self {
		Self { sidecar_process: Mutex::new(None) }
	}
}


