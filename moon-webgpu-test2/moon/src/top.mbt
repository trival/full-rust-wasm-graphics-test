///|
#external
priv type GPU

///|
extern "js" fn navigatorGPU() -> GPU =
  #| () => navigator.gpu

///|
#external
priv type GPUAdapterPromise

///|
extern "js" fn GPU::requestAdapter(self : GPU) -> GPUAdapterPromise =
  #| (gpu) => gpu.requestAdapter()

///|
extern "js" fn adapter_promise_then(
  promise : GPUAdapterPromise,
  f : (GPUAdapter) -> Unit,
) -> Unit =
  #| (promise, f) => promise.then(f)

///|
#external
priv type GPUAdapter

///|
#external
priv type GPUDevicePromise

///|
extern "js" fn GPUAdapter::requestDevice(self : GPUAdapter) -> GPUDevicePromise =
  #| (adapter) => adapter.requestDevice()

///|
extern "js" fn device_promise_then(
  promise : GPUDevicePromise,
  f : (GPUDevice) -> Unit,
) -> Unit =
  #| (promise, f) => promise.then(f)

///|
#external
priv type GPUDevice

// async function main() {
//   const adapter = await navigator.gpu?.requestAdapter();
//   const device = await adapter?.requestDevice();
//   if (!device) {
//     fail('need a browser that supports WebGPU');
//     return;
//   }

//   // Get a WebGPU context from the canvas and configure it
//   const canvas = document.querySelector('canvas');
//   const context = canvas.getContext('webgpu');
//   const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
//   context.configure({
//     device,
//     format: presentationFormat,
//   });

//   const module = device.createShaderModule({
//     label: 'our hardcoded red triangle shaders',
//     code: `
//       @vertex fn vs(
//         @builtin(vertex_index) vertexIndex : u32
//       ) -> @builtin(position) vec4f {
//         let pos = array(
//           vec2f( 0.0,  0.5),  // top center
//           vec2f(-0.5, -0.5),  // bottom left
//           vec2f( 0.5, -0.5)   // bottom right
//         );

//         return vec4f(pos[vertexIndex], 0.0, 1.0);
//       }

//       @fragment fn fs() -> @location(0) vec4f {
//         return vec4f(1, 0, 0, 1);
//       }
//     `,
//   });

//   const pipeline = device.createRenderPipeline({
//     label: 'our hardcoded red triangle pipeline',
//     layout: 'auto',
//     vertex: {
//       module,
//     },
//     fragment: {
//       module,
//       targets: [{ format: presentationFormat }],
//     },
//   });

//   const renderPassDescriptor = {
//     label: 'our basic canvas renderPass',
//     colorAttachments: [
//       {
//         // view: <- to be filled out when we render
//         clearValue: [0.3, 0.3, 0.3, 1],
//         loadOp: 'clear',
//         storeOp: 'store',
//       },
//     ],
//   };

//   function render() {
//     // Get the current texture from the canvas context and
//     // set it as the texture to render to.
//     renderPassDescriptor.colorAttachments[0].view =
//         context.getCurrentTexture().createView();

//     const encoder = device.createCommandEncoder({ label: 'our encoder' });
//     const pass = encoder.beginRenderPass(renderPassDescriptor);
//     pass.setPipeline(pipeline);
//     pass.draw(3);  // call our vertex shader 3 times
//     pass.end();

//     const commandBuffer = encoder.finish();
//     device.queue.submit([commandBuffer]);
//   }

//   render();
// }

// function fail(msg) {
//   // eslint-disable-next-line no-alert
//   alert(msg);
// }

// main();

///| `run_async` spawn a new coroutine and execute an async function in it
fn run_async(f : async () -> Unit noraise) -> Unit = "%async.run"

///| `suspend` will suspend the execution of the current coroutine.
/// The suspension will be handled by a callback passed to `suspend`
async fn[T, E : Error] suspend(
  // `f` is a callback for handling suspension
  f : (
    // the first parameter of `f` is used to resume the execution of the coroutine normally
    (T) -> Unit,
    // the second parameter of `f` is used to cancel the execution of the current coroutine
    // by throwing an error at suspension point
    (E) -> Unit,
  ) -> Unit,
) -> T raise E = "%async.suspend"

///|
async fn awaitAdapter(promise : GPUAdapterPromise) -> GPUAdapter raise {
  suspend((resolve, _cancel) => adapter_promise_then(promise, resolve))
}

///|
async fn awaitDevice(promise : GPUDevicePromise) -> GPUDevice raise {
  suspend((resolve, _cancel) => device_promise_then(promise, resolve))
}

///|
extern "js" fn js_set_timeout(f : () -> Unit, duration~ : Int) -> Unit =
  #| setTimeout

///|
async fn sleep(duration : Int) -> Unit raise {
  suspend(fn(resume_ok, _resume_err) {
    js_set_timeout(duration~, fn() { resume_ok(()) })
  })
}

///|
fn log_device(device : GPUDevice) -> Unit = "console" "log"

///|
fn log_gpu(msg : GPU) -> Unit = "console" "log"

///|
pub fn greeting() -> Unit {
  run_async(async fn() noraise {
    try {
      println("Hello from moon-webgpu-test!")
      sleep(1000)
      println("Hello from moon-webgpu-test2!")
      let gpu = navigatorGPU()
      log_gpu(gpu)
      let adapter = awaitAdapter(gpu.requestAdapter())
      let device = awaitDevice(adapter.requestDevice())
      log_device(device)
    } catch {
      _ => println("An error occurred while greeting")
    }
  })
}
