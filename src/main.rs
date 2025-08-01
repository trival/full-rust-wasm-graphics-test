use leptos::html;
use leptos::prelude::*;
use std::sync::mpsc::{channel, Receiver, Sender};
use web_sys::HtmlCanvasElement;

mod simple;
use trivalibs::painter::app::CanvasApp;

#[component]
fn App(tx: Sender<HtmlCanvasElement>) -> impl IntoView {
    let canvas_ref = NodeRef::<html::Canvas>::new();

    // State for UI controls
    let (color_r, set_color_r) = signal(1.0);
    let (color_g, set_color_g) = signal(0.0);
    let (color_b, set_color_b) = signal(0.0);

    // Send canvas to graphics thread when it's loaded
    Effect::new(move |_| {
        if let Some(canvas) = canvas_ref.get() {
            let canvas_element: HtmlCanvasElement = canvas.into();
            let _ = tx.send(canvas_element);
        }
    });

    view! {
        <div style="display: flex; flex-direction: column; height: 100vh;">
            <div style="padding: 10px; background-color: #f0f0f0;">
                <h1>"WASM Graphics Test with Leptos"</h1>
                <div style="display: flex; gap: 20px;">
                    <label>
                        "Red: "
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value=color_r
                            on:input=move |ev| {
                                set_color_r.set(event_target_value(&ev).parse().unwrap_or(1.0))
                            }
                        />
                        {move || format!("{:.2}", color_r.get())}
                    </label>
                    <label>
                        "Green: "
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value=color_g
                            on:input=move |ev| {
                                set_color_g.set(event_target_value(&ev).parse().unwrap_or(0.0))
                            }
                        />
                        {move || format!("{:.2}", color_g.get())}
                    </label>
                    <label>
                        "Blue: "
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value=color_b
                            on:input=move |ev| {
                                set_color_b.set(event_target_value(&ev).parse().unwrap_or(0.0))
                            }
                        />
                        {move || format!("{:.2}", color_b.get())}
                    </label>
                </div>
            </div>
            <canvas
                node_ref=canvas_ref
                style="flex: 1; width: 100%;"
                id="wgpu-canvas"
            />
        </div>
    }
}

fn main() {
    // Set up panic hook (logger will be initialized by trivalibs)
    console_error_panic_hook::set_once();

    // Create channel for passing canvas from Leptos to graphics
    let (tx, rx): (Sender<HtmlCanvasElement>, Receiver<HtmlCanvasElement>) = channel();

    // Mount Leptos app
    leptos::mount::mount_to_body(move || view! { <App tx=tx.clone() /> });

    // Start graphics app when canvas is received
    wasm_bindgen_futures::spawn_local(async move {
        log::info!("Waiting for canvas...");

        // For now, we'll just log when we receive the canvas
        // In a complete implementation, we would:
        // 1. Fix trivalibs' app.rs to accept a pre-existing canvas
        // 2. Create window with the canvas using winit's with_canvas()
        // 3. Start the TriangleApp

        if let Ok(_canvas) = rx.recv() {
            log::info!("Canvas received! Ready to start graphics app...");

            // For now, let's try starting the app anyway
            // This will create its own canvas, but shows the structure
            simple::SimpleApp::create().start();
        }
    });
}
