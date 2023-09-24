use std::ops::Add;

use egui::{Align2, PointerButton, Pos2, Vec2};
use egui_extras::RetainedImage;
use poll_promise::Promise;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}

struct Resource {
  /// HTTP response
  response: ehttp::Response,
  /// If set, the response was an image.
  image: Option<RetainedImage>,
}

impl Resource {
  fn from_response(ctx: &egui::Context, response: ehttp::Response) -> Self {
    let content_type = response.content_type().unwrap_or_default();
    let image = if content_type.starts_with("image/") {
      RetainedImage::from_image_bytes(&response.url, &response.bytes).ok()
    } else {
      None
    };

    Self { response, image }
  }
}

#[derive(Debug, Clone, Copy, serde::Deserialize, serde::Serialize)]
#[wasm_bindgen(constructor)]
pub struct Image {
  pub orientation: u32,
}

#[cfg_attr(feature = "serde", derive(serde::Deserialize, serde::Serialize, wasm))]
pub struct TemplateApp {
  url: String,
  image: Image,
  zoom: f32,
  position: Pos2,

  #[cfg_attr(feature = "serde", serde(skip))]
  promise: Option<Promise<ehttp::Result<Resource>>>,
}

impl Default for TemplateApp {
  fn default() -> Self {
    Self {
      url: "".to_owned(),
      zoom: 1.0,
      position: Pos2 { x: 0.0, y: 0.0 },
      image: Image { orientation: 0 },
      promise: None,
    }
  }
}

impl TemplateApp {
  pub fn new(cc: &eframe::CreationContext<'_>, url: &str, image: Image) -> Self {
    // if let Some(storage) = cc.storage {
    //     return eframe::get_value(storage, eframe::APP_KEY).unwrap_or_default();
    // }

    // unsafe {
    //     log(format!("url: {:?}", image_url()).as_str());
    // }

    let mut app: TemplateApp = Default::default();

    app.image = image;
    app.url = url.to_string();

    let ctx = cc.egui_ctx.clone();
    let (sender, promise) = Promise::new();
    let request = ehttp::Request::get(app.url.clone());
    ehttp::fetch(request, move |response| {
      ctx.request_repaint(); // wake up UI thread
      let resource = response.map(|response| Resource::from_response(&ctx, response));
      sender.send(resource);
    });

    if app.url.len() > 0 {
      app.promise = Some(promise);
    }

    app
  }
}

impl eframe::App for TemplateApp {
  // fn save(&mut self, storage: &mut dyn eframe::Storage) {
  //     eframe::set_value(storage, eframe::APP_KEY, self);
  // }

  fn clear_color(&self, _visuals: &egui::Visuals) -> [f32; 4] {
    return [0.0, 0.0, 0.0, 0.0];
  }

  fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
    ctx.input(|i| {
      self.zoom += i.scroll_delta.y / 1000.0;
      self.zoom = self.zoom.max(0.8);
      self.zoom = self.zoom.min(4.0);

      if i.pointer.button_down(PointerButton::Primary) {
        self.position = self.position.add(Vec2 {
          x: i.pointer.velocity().x / 100.0 / self.zoom,
          y: i.pointer.velocity().y / 100.0 / self.zoom,
        });
      }
    });

    // should be relative to the image display size
    let zoom = self.zoom * self.zoom;

    let mut offset = Vec2 { x: 0.0, y: 0.0 };

    let resource = if let Some(promise) = &self.promise {
      if let Some(result) = promise.ready() {
        match result {
          Ok(resource) => Some(resource),
          Err(error) => None,
        }
      } else {
        None
      }
    } else {
      None
    };

    if let Some(resource) = resource {
      let img = resource.image.as_ref().unwrap();
      offset.x = ((img.width() as f32) * zoom) / 2.0;
      offset.y = ((img.height() as f32) * zoom) / 2.0;
    }

    egui::Area::new("view")
      .movable(true)
      .pivot(Align2::CENTER_CENTER)
      .current_pos(Pos2 {
        x: (self.position.x * zoom + (ctx.screen_rect().width() / 2.0) - offset.x),
        y: (self.position.y * zoom + (ctx.screen_rect().height() / 2.0) - offset.y),
      })
      .drag_bounds(ctx.available_rect().expand(10000.0))
      .show(ctx, |ui| {
        if let Some(promise) = &self.promise {
          if let Some(result) = promise.ready() {
            match result {
              Ok(resource) => {
                let Resource { response, image } = resource;

                if let Some(image) = image {
                  let mut size = image.size_vec2();
                  image.show_size(ui, size * zoom);
                }
              }
              Err(error) => {
                // This should only happen if the fetch API isn't available or something similar.
                ui.colored_label(
                  ui.visuals().error_fg_color,
                  if error.is_empty() { "Error" } else { error },
                );
              }
            }
          } else {
            ui.spinner();
          }
        } else {
          // no image selected
        }

        // ui.label(format!("pos: {:?} zoom: {:?}", self.position, zoom));

        // ctx.inspection_ui(ui);

        // ui.image(texture_id, size)
        // ui.strong("Bold text");

        // // Create a "canvas" for drawing on that's 100% x 300px
        // let (response, painter) =
        //     ui.allocate_painter(Vec2::new(ui.available_width(), 300.0), egui::Sense::hover());

        // // Get the relative position of our "canvas"
        // let to_screen = RectTransform::from_to(
        //     Rect::from_min_size(Pos2::ZERO, response.rect.size()),
        //     response.rect,
        // );

        // // The line we want to draw represented as 2 points
        // let first_point = Pos2 { x: 0.0, y: 0.0 };
        // let second_point = Pos2 { x: 300.0, y: 300.0 };
        // // Make the points relative to the "canvas"
        // let first_point_in_screen = to_screen.transform_pos(first_point);
        // let second_point_in_screen = to_screen.transform_pos(second_point);

        // // Paint the line!
        // painter.add(Shape::LineSegment {
        //     points: [first_point_in_screen, second_point_in_screen],
        //     stroke: Stroke {
        //         width: 10.0,
        //         color: Color32::BLUE,
        //     },
        // });
      });
  }
}