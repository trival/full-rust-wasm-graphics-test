use leptos::html;
use leptos::prelude::*;
use trivalibs::painter::app::{AppConfig, CanvasApp, CanvasHandle};
use trivalibs::utils::default;

mod render;
use render::{ColorEvent, SimpleApp};

#[allow(non_snake_case)]
#[component]
fn App(handle: CanvasHandle<ColorEvent>, canvas_ref: NodeRef<html::Canvas>) -> impl IntoView {
    // State for UI controls
    let (color_r, set_color_r) = signal(1.0);
    let (color_g, set_color_g) = signal(0.0);
    let (color_b, set_color_b) = signal(0.0);

    // Send color updates when values change
    Effect::new(move |_| {
        let r = color_r.get();
        let g = color_g.get();
        let b = color_b.get();

        let _ = handle.send_event(ColorEvent { r, g, b });
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
    // Set up panic hook
    console_error_panic_hook::set_once();

    // Create canvas node ref
    let canvas_ref = NodeRef::<html::Canvas>::new();
    let canvas_ref_for_app = canvas_ref.clone();

    // Create the app but don't start it yet
    let app = SimpleApp::create();
    let handle = app.get_handle();

    // Mount Leptos app
    leptos::mount::mount_to_body(move || {
        view! {
            <App handle=handle canvas_ref=canvas_ref />
        }
    });

    // Get the canvas element after DOM is ready and start the app
    wasm_bindgen_futures::spawn_local(async move {
        // Wait a bit for DOM to be ready
        gloo_timers::future::TimeoutFuture::new(50).await;

        // Get the canvas element
        if let Some(canvas) = canvas_ref_for_app.get() {
            app.config(AppConfig {
                canvas: Some(canvas),
                ..default()
            })
            .start();
        }
    });
}
