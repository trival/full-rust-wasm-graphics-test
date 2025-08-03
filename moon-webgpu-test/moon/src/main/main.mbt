///|
pub fn create_webgpu_renderer(
  device : @lib.GPUDevice,
  context : @lib.GPUCanvasContext,
  format : String,
) -> Unit {
  let queue = @lib.device_getQueue(device)
  let webgpu_context = @lib.WebGPUContext::{ device, context, format, queue }

  // Create renderer
  match @lib.create_renderer(webgpu_context) {
    Some(renderer) => {
      // Render single frame
      @lib.render_frame(renderer)
      println("WebGPU triangle rendered successfully!")
    }
    None => println("Failed to create renderer")
  }
}

///|
fn main {
  // Main function is required but won't be called in web context
}
