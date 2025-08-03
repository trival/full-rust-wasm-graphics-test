# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build
```bash
moon build --target js
```

### Clean
```bash
moon clean
```

## Architecture

This is a MoonBit WebGPU project that demonstrates FFI bindings to JavaScript WebGPU APIs.

### Project Structure
- **src/lib/**: WebGPU implementation library
  - `webgpu_types.mbt`: External type declarations for WebGPU APIs
  - `webgpu_init.mbt`: WebGPU initialization and context setup
  - `triangle.mbt`: Triangle vertex data definitions
  - `shaders.mbt`: WGSL shader code as multi-line strings
  - `renderer.mbt`: Render pipeline and frame rendering
- **src/main/**: Executable package that exports functions for JavaScript
  - `main.mbt`: Entry point with exported `init_webgpu_renderer` function

### Key Patterns

1. **FFI Syntax**: External JavaScript functions are declared using:
   ```moonbit
   extern "js" fn functionName(params) -> ReturnType =
     #| (params) => jsCode
   ```

2. **Multi-line Strings**: Use `#|` prefix for each line:
   ```moonbit
   let str = 
     #| line 1
     #| line 2
   ```

3. **Type Declarations**: External types are opaque and declared as:
   ```moonbit
   pub type TypeName
   ```

4. **Module Exports**: Functions are exported to JavaScript via `moon.pkg.json`:
   ```json
   "link": {
     "js": {
       "exports": ["function_name"],
       "format": "esm"
     }
   }
   ```

### WebGPU Integration
The project implements a complete WebGPU rendering pipeline:
1. GPU adapter and device initialization
2. Canvas context configuration
3. Shader module creation from WGSL code
4. Render pipeline setup
5. Single frame rendering of an RGB triangle

### Build Output
JavaScript modules are generated in `target/js/release/build/main/` and can be imported as ES modules.