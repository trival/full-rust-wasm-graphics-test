use trivalibs::painter::prelude::*;
use trivalibs::prelude::*;

pub struct TriangleApp {
    canvas: Layer,
}

impl CanvasApp<()> for TriangleApp {
    fn init(p: &mut Painter) -> Self {
        // Create a simple layer with just a clear color
        // This is the simplest possible graphics app
        let canvas = p
            .layer()
            .with_clear_color(wgpu::Color {
                r: 0.2,
                g: 0.3,
                b: 0.8,
                a: 1.0,
            })
            .create();

        Self { canvas }
    }

    fn resize(&mut self, _p: &mut Painter, _width: u32, _height: u32) {
        // No resize logic needed for simple triangle
    }

    fn update(&mut self, p: &mut Painter, _tpf: f32) {
        p.request_next_frame();
    }

    fn render(&self, p: &mut Painter) -> Result<(), SurfaceError> {
        p.paint_and_show(self.canvas)
    }

    fn event(&mut self, _e: Event<()>, _p: &mut Painter) {
        // No event handling needed for simple triangle
    }
}