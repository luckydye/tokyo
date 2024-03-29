use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Library;
#[cfg(mobile)]
use mobile::Library;

pub trait LibraryExt<R: Runtime> {
  fn library(&self) -> &Library<R>;
}

impl<R: Runtime, T: Manager<R>> crate::LibraryExt<R> for T {
  fn library(&self) -> &Library<R> {
    self.state::<Library<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  env_logger::init();

  Builder::new("tokyo")
    .invoke_handler(tauri::generate_handler![
      commands::request,
      // commands::get_locations,
      // commands::get_thumbnail,
      // commands::get_index,
      // commands::get_system,
      // commands::create_library,
      // commands::get_metadata,
      // commands::get_image,
      // commands::post_location,
      // commands::post_metadata,
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let library = mobile::init(app, api);
      #[cfg(desktop)]
      let library = desktop::init(app, api);
      app.manage(library);
      Ok(())
    })
    .build()
}
