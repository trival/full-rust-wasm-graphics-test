# MoonBit WebGPU Triangle Demo

A proof-of-concept WebGPU renderer built with MoonBit that compiles to JavaScript. This project demonstrates how to use MoonBit's FFI capabilities to interface with WebGPU APIs and render a classic RGB triangle.

## Overview

This project consists of:
- A MoonBit project that defines WebGPU FFI bindings and implements a triangle renderer
- A Vite-based web project that hosts the compiled MoonBit code
- WebGPU triangle rendering with each vertex colored in RGB (red, green, blue)

## Prerequisites

- [MoonBit](https://www.moonbitlang.com/) installed (`moon` CLI)
- Node.js and npm
- A browser with WebGPU support (Chrome 113+, Edge 113+, or Chrome Canary)

## Project Structure

```
.
├── moon/                    # MoonBit project
│   ├── src/
│   │   ├── lib/            # Library package with WebGPU implementation
│   │   │   ├── webgpu_types.mbt    # WebGPU FFI type definitions
│   │   │   ├── webgpu_init.mbt     # WebGPU initialization
│   │   │   ├── triangle.mbt        # Triangle vertex data
│   │   │   ├── shaders.mbt         # WGSL shader code
│   │   │   └── renderer.mbt        # Render pipeline setup
│   │   └── main/           # Main package
│   │       └── main.mbt    # Entry point
│   └── target/             # Build output
├── src/                    # Vite project source
│   ├── main.ts            # TypeScript entry point
│   └── style.css          # Styles
├── index.html             # HTML with canvas element
└── package.json           # npm configuration
```

## How It Works

1. **MoonBit WebGPU FFI**: The project defines external type bindings for WebGPU APIs using MoonBit's FFI syntax:
   ```moonbit
   extern "js" fn navigatorGPU() -> GPU =
     #| () => navigator.gpu
   ```

2. **Shader Code**: WGSL shaders are embedded as multi-line strings in MoonBit:
   ```moonbit
   pub let vertex_shader_code : String = 
     #| struct VertexOutput {
     #|   @builtin(position) position: vec4<f32>,
     #|   @location(0) color: vec3<f32>,
     #| };
   ```

3. **Rendering Pipeline**: The renderer creates a WebGPU pipeline with:
   - Vertex shader that positions three vertices in a triangle
   - Fragment shader that interpolates colors between vertices
   - Each vertex is colored with pure R, G, or B

4. **JavaScript Integration**: MoonBit compiles to ES modules that are imported by the Vite project

## Building and Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build and run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

You should see a triangle with:
- Red vertex at the top
- Green vertex at the bottom left
- Blue vertex at the bottom right
- Smooth color gradients between vertices

## Build Commands

- `npm run build:moon` - Compile MoonBit to JavaScript
- `npm run dev` - Build MoonBit and start Vite dev server
- `npm run build` - Production build

## Technical Details

### MoonBit FFI Approach

This project demonstrates several MoonBit FFI patterns:

1. **External Types**: Declaring opaque JavaScript types
   ```moonbit
   pub type GPU
   pub type GPUDevice
   ```

2. **External Functions**: Wrapping JavaScript APIs
   ```moonbit
   extern "js" fn device_createShaderModule(device : GPUDevice, code : String) -> GPUShaderModule =
     #| (device, code) => device.createShaderModule({ code })
   ```

3. **Module Exports**: Exposing MoonBit functions to JavaScript
   ```json
   "link": {
     "js": {
       "exports": ["init_webgpu_renderer"],
       "format": "esm"
     }
   }
   ```

### WebGPU Implementation

The WebGPU implementation follows the standard initialization flow:
1. Request GPU adapter
2. Request device
3. Configure canvas context
4. Create shader modules
5. Create render pipeline
6. Render frame with draw commands

## Future Improvements

- Add vertex buffer support instead of hardcoded vertices in shader
- Implement animation loop
- Add more complex geometry
- Support for textures
- Error handling and fallbacks

## License

MIT