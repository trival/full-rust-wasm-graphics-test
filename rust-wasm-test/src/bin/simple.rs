use trivalibs::painter::app::CanvasApp;
use wasm_graphics_test::simple::SimpleApp;

fn main() {
    // Set up panic hook for better error messages
    console_error_panic_hook::set_once();
    
    log::info!("Starting simple graphics app...");
    
    // Create and start the app - trivalibs handles everything
    SimpleApp::create().start();
}