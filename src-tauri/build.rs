fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    if !src.exists() {
        return Ok(());
    }
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else if file_type.is_file() {
            if let Some(parent) = dst_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            std::fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

fn main() {
    // Mirror .next/standalone into src-tauri/next/standalone before the Tauri build runs
    let workspace_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf();
    let next_standalone = workspace_root.join(".next").join("standalone");
    let next_static = workspace_root.join(".next").join("static");
    let public_dir = workspace_root.join("public");
    let tauri_next = workspace_root.join("src-tauri").join("next");
    let tauri_next_standalone = tauri_next.join("standalone");
    let tauri_next_dotnext = tauri_next_standalone.join(".next");
    let tauri_next_static = tauri_next_dotnext.join("static");
    let tauri_next_public = tauri_next_standalone.join("public");

    // Clean destination to avoid stale files
    let _ = std::fs::remove_dir_all(&tauri_next);
    let _ = copy_dir_recursive(&next_standalone, &tauri_next_standalone);

    // Ensure .next/static is available alongside server.js
    let _ = std::fs::create_dir_all(&tauri_next_dotnext);
    let _ = copy_dir_recursive(&next_static, &tauri_next_static);

    // Copy public/ assets so Next can serve them in production
    let _ = copy_dir_recursive(&public_dir, &tauri_next_public);

    tauri_build::build();
}
