use trivalibs::painter::prelude::*;
use trivalibs::prelude::*;

pub struct SimpleApp {
    canvas: Layer,
    time: f32,
}

impl CanvasApp<()> for SimpleApp {
    fn init(p: &mut Painter) -> Self {
        log::info!("SimpleApp::init called");
        
        // Create the simplest possible layer - just a colored background
        let canvas = p
            .layer()
            .with_clear_color(wgpu::Color {
                r: 0.2,
                g: 0.3,
                b: 0.8,
                a: 1.0,
            })
            .create();

        log::info!("Layer created successfully");

        Self { 
            canvas,
            time: 0.0,
        }
    }

    fn resize(&mut self, _p: &mut Painter, width: u32, height: u32) {
        log::info!("SimpleApp::resize called: {}x{}", width, height);
    }

    fn update(&mut self, p: &mut Painter, tpf: f32) {
        self.time += tpf;
        
        // Change color over time to verify updates are working
        let _r = (self.time.sin() + 1.0) * 0.5;
        let _g = ((self.time * 1.3).sin() + 1.0) * 0.5;
        let _b = ((self.time * 0.7).sin() + 1.0) * 0.5;
        
        // Request next frame to keep animating
        p.request_next_frame();
    }

    fn render(&self, p: &mut Painter) -> Result<(), SurfaceError> {
        log::debug!("SimpleApp::render called");
        p.paint_and_show(self.canvas)
    }

    fn event(&mut self, _e: Event<()>, _p: &mut Painter) {
        // No event handling needed
    }
}