use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandEvent, Child};

pub struct LlmServerState {
  pub child: Mutex<Option<Child>>,
  pub current_model: Mutex<String>,
}

#[derive(serde::Serialize)]
pub struct ModelInfo {
  name: String,
  display_name: String,
  exists: bool,
  size_gb: f64,
  description: String,
}

fn spawn_sidecar(
  app: &tauri::AppHandle,
  state: &LlmServerState,
  model_name: &str,
) -> Result<(), String> {
  // 1. Kill old process if exists
  {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(mut child) = child_guard.take() {
      let _ = child.kill();
    }
  }

  // 2. Resolve model path
  let models_dir = app.path().resource_dir()
    .map(|p| p.join("models"))
    .unwrap_or_else(|_| std::path::PathBuf::from("models"));
  let model_path = models_dir.join(model_name);

  let path_str = if model_path.exists() {
    model_path.to_string_lossy().to_string()
  } else {
    format!("models/{}", model_name)
  };

  log::info!("Spawning llama-server with model: {}", path_str);

  // 3. Spawn the sidecar
  let sidecar_command = app.shell().sidecar("llama-server")
    .map_err(|e| e.to_string())?
    .args(["-m", &path_str, "--port", "8080", "--host", "127.0.0.1"]);

  let (mut rx, child) = sidecar_command.spawn()
    .map_err(|e| e.to_string())?;

  // 4. Listen to stdout/stderr
  tauri::async_runtime::spawn(async move {
    while let Some(event) = rx.recv().await {
      match event {
        CommandEvent::Stdout(line) => {
          log::info!("llama-server: {}", String::from_utf8_lossy(&line));
        }
        CommandEvent::Stderr(line) => {
          log::error!("llama-server error: {}", String::from_utf8_lossy(&line));
        }
        _ => {}
      }
    }
  });

  // 5. Update state
  {
    let mut child_guard = state.child.lock().unwrap();
    *child_guard = Some(child);
  }
  {
    let mut model_guard = state.current_model.lock().unwrap();
    *model_guard = model_name.to_string();
  }

  Ok(())
}

#[tauri::command]
fn get_current_model(state: tauri::State<'_, LlmServerState>) -> String {
  state.current_model.lock().unwrap().clone()
}

#[tauri::command]
fn get_available_models(app: tauri::AppHandle) -> Result<Vec<ModelInfo>, String> {
  let models_dir = app.path().resource_dir()
    .map(|p| p.join("models"))
    .unwrap_or_else(|_| std::path::PathBuf::from("models"));

  let mut models = vec![
    ModelInfo {
      name: "gemma4-e2b.gguf".to_string(),
      display_name: "Gemma E2B (2B 4-bit)".to_string(),
      exists: false,
      size_gb: 1.5,
      description: "Extremely fast. Recommended for 4GB - 6GB VRAM.".to_string(),
    },
    ModelInfo {
      name: "gemma4-e4b.gguf".to_string(),
      display_name: "Gemma E4B (4B 4-bit)".to_string(),
      exists: false,
      size_gb: 3.0,
      description: "Balanced. Recommended for 8GB VRAM.".to_string(),
    },
    ModelInfo {
      name: "gemma2-9b.gguf".to_string(),
      display_name: "Gemma 2 9B (9B 4-bit)".to_string(),
      exists: false,
      size_gb: 5.5,
      description: "High Logic. Recommended for 12GB+ VRAM.".to_string(),
    },
  ];

  for model in &mut models {
    let path = models_dir.join(&model.name);
    model.exists = path.exists();
    if model.exists {
      if let Ok(metadata) = std::fs::metadata(&path) {
        let size_bytes = metadata.len();
        model.size_gb = (size_bytes as f64) / (1024.0 * 1024.0 * 1024.0);
      }
    }
  }

  Ok(models)
}

#[tauri::command]
async fn swap_model(
  app: tauri::AppHandle,
  state: tauri::State<'_, LlmServerState>,
  model_name: String,
) -> Result<String, String> {
  if model_name != "gemma4-e2b.gguf" && model_name != "gemma4-e4b.gguf" && model_name != "gemma2-9b.gguf" {
    return Err("Unsupported model".to_string());
  }

  spawn_sidecar(&app, &state, &model_name)?;
  Ok(model_name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize state
      let state = LlmServerState {
        child: Mutex::new(None),
        current_model: Mutex::new("gemma4-e2b.gguf".to_string()),
      };
      app.manage(state);

      // Spawn default model
      let state_ref = app.state::<LlmServerState>();
      if let Err(e) = spawn_sidecar(app.handle(), &state_ref, "gemma4-e2b.gguf") {
        log::error!("Failed to spawn default llama-server sidecar: {}", e);
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_current_model,
      get_available_models,
      swap_model
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

