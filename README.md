# WASM Graphics Test

A minimal example of using trivalibs painter with WASM and Leptos.

## Current Status

This project demonstrates:
- Basic Leptos app with UI controls
- Triangle renderer using trivalibs painter abstractions
- WASM setup with proper dependencies
- Canvas integration structure (partial)

## Known Limitations

The canvas integration is not fully working yet. The main issue is that trivalibs' `app.rs` needs to be modified to accept a pre-existing canvas element. Currently:
- Leptos creates and manages the canvas element
- The canvas is passed through a channel to the graphics initialization
- But `CanvasApp::create()` doesn't support using an existing canvas

## How to Run

1. First, compile the shaders (requires rust-gpu):
   ```bash
   ./build_shaders.sh
   ```

2. Run with trunk:
   ```bash
   trunk serve
   ```

## Next Steps

To complete the integration:

1. Modify `trivalibs/crates/trivalibs_painter/src/app.rs` to:
   - Accept an optional canvas parameter in the window creation
   - Use `winit::platform::web::WindowAttributesExtWebSys::with_canvas()` when a canvas is provided
   - Update the canvas initialization code (currently commented out)

2. Create a proper startup function that:
   - Receives the canvas from Leptos
   - Creates the winit window with that canvas
   - Initializes the Painter with the window
   - Starts the render loop

3. Connect the UI controls to actually modify the triangle colors

## Architecture

```
Leptos UI
    |
    v
Canvas Element
    |
    v
Channel
    |
    v
Graphics App (trivalibs)
    |
    v
wgpu rendering
```

The goal is to have Leptos manage the UI and canvas lifecycle, while trivalibs handles all the graphics rendering within that canvas.