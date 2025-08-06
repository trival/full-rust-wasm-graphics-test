use trivalibs::painter::app::CanvasApp;
use wasm_graphics_test::render::SimpleApp;

fn main() {
    // Create and start the app - trivalibs handles everything
    SimpleApp::create().start();
}
