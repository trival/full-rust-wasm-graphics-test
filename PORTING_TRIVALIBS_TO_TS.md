# Porting Trivalibs Painter to TypeScript/WebGPU

## Table of Contents
1. [Motivation and Performance Analysis](#motivation-and-performance-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [API Design Patterns](#api-design-patterns)
5. [Implementation Phases](#implementation-phases)
6. [Code Examples](#code-examples)
7. [Migration Strategy](#migration-strategy)
8. [Performance Optimizations](#performance-optimizations)

## Motivation and Performance Analysis

### Current WASM Issues
When compiling Rust/wgpu to WASM, we encounter several performance bottlenecks:

1. **WASM Overhead**: 
   - Function calls between JavaScript and WASM have overhead
   - Memory must be copied between JS and WASM heaps
   - WASM linear memory model adds indirection

2. **Bundle Size**: 
   - WASM binaries include the entire Rust runtime
   - wgpu abstraction layer adds significant size
   - Current size: 3MB+ vs potential TypeScript: ~100KB

3. **Double Abstraction**: 
   - wgpu → WebGPU API adds an extra translation layer
   - Native WebGPU calls would be more direct

### Expected Benefits of TypeScript Port

- **Performance**: 5-10x improvement by eliminating WASM overhead
- **Bundle Size**: ~100KB instead of 3MB+
- **Developer Experience**: Native TypeScript with full IDE support
- **Debugging**: Use browser DevTools directly
- **Integration**: Easier integration with web frameworks

## Architecture Overview

### Rust Trivalibs Structure
```
Painter (Core Renderer)
├── Forms (Vertex/Index Buffers)
├── Shaders (Shader Modules)
├── Shapes (Form + Shader + Bindings)
├── Layers (Render Targets)
├── Bindings (Uniforms/Textures)
├── Effects (Post-processing)
└── App Framework (Event Loop)
```

### TypeScript Equivalent Structure
```
Painter (Core Renderer)
├── Resources
│   ├── FormManager
│   ├── ShaderManager
│   ├── TextureManager
│   └── BufferManager
├── Rendering
│   ├── Shape
│   ├── Layer
│   └── Effect
├── Bindings
│   ├── UniformBuffer
│   └── TextureBinding
└── App Framework
    ├── CanvasApp Interface
    └── EventSystem
```

## Core Components

### 1. Painter Class
The main renderer that manages WebGPU resources.

**Rust:**
```rust
pub struct Painter {
    pub surface: wgpu::Surface<'static>,
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    // Resource storage...
}
```

**TypeScript:**
```typescript
export class Painter {
    private device: GPUDevice;
    private queue: GPUQueue;
    private context: GPUCanvasContext;
    private resources: ResourceManager;
    
    async init(canvas: HTMLCanvasElement): Promise<void> {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = canvas.getContext('webgpu');
        // ...
    }
}
```

### 2. Form System (Geometry)
Manages vertex and index buffers.

**Rust:**
```rust
pub struct Form(pub(crate) usize);
pub struct FormBuilder<'a> {
    painter: &'a mut Painter,
    // ...
}
```

**TypeScript:**
```typescript
export class Form {
    constructor(
        private vertexBuffer: GPUBuffer,
        private indexBuffer?: GPUBuffer,
        public vertexCount: number,
        public indexCount: number
    ) {}
}

export class FormBuilder {
    constructor(private painter: Painter) {}
    
    build<T extends ArrayLike<number>>(vertices: T, indices?: Uint32Array): Form {
        // Create GPU buffers...
    }
}
```

### 3. Shader System
Manages shader modules and pipeline layouts.

**Rust (Current):**
```rust
pub struct Shade(pub(crate) usize);
pub struct ShadeBuilder<'a> {
    painter: &'a mut Painter,
    vertex_attributes: Vec<wgpu::VertexFormat>,
    // ...
}
// Shaders are compiled from Rust using rust-gpu
load_vertex_shader!(shade, p, "./shader/vertex.spv");
```

**TypeScript (Port):**
```typescript
export class Shader {
    constructor(
        private vertexModule: GPUShaderModule,
        private fragmentModule: GPUShaderModule,
        private bindGroupLayouts: GPUBindGroupLayout[]
    ) {}
}

export class ShaderBuilder {
    constructor(private painter: Painter) {}
    
    withVertexAttributes(attributes: GPUVertexFormat[]): this { /* ... */ }
    withBindings(bindings: BindingLayout[]): this { /* ... */ }
    
    // Load WGSL shaders directly
    async withVertexSource(wgsl: string): Promise<this> { /* ... */ }
    async withFragmentSource(wgsl: string): Promise<this> { /* ... */ }
    
    // Or load from files
    async loadVertexShader(url: string): Promise<this> { /* ... */ }
    async loadFragmentShader(url: string): Promise<this> { /* ... */ }
    
    async create(): Promise<Shader> { /* ... */ }
}
```

**Important Note:** While the Rust version uses rust-gpu to compile shaders from Rust code (allowing code reuse between CPU and GPU), the TypeScript port will use standard WGSL files. This trade-off simplifies the porting process and aligns with web standards, though we lose the ability to share math libraries between CPU and GPU code.

### 4. Binding System
Manages uniform buffers and texture bindings.

**TypeScript:**
```typescript
export class BindingBuffer<T> {
    private buffer: GPUBuffer;
    
    constructor(private painter: Painter, private size: number) {
        this.buffer = painter.device.createBuffer({
            size: this.size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }
    
    update(data: T): void {
        this.painter.queue.writeBuffer(this.buffer, 0, data as ArrayBuffer);
    }
}
```

### 5. Layer System
Manages render targets and render passes.

**TypeScript:**
```typescript
export class Layer {
    private colorTextures: GPUTexture[];
    private depthTexture?: GPUTexture;
    private shapes: Shape[];
    
    constructor(private painter: Painter, private props: LayerProps) {
        // Create render targets...
    }
    
    render(encoder: GPUCommandEncoder): void {
        const pass = encoder.beginRenderPass({
            colorAttachments: this.getColorAttachments(),
            depthStencilAttachment: this.getDepthAttachment()
        });
        
        for (const shape of this.shapes) {
            shape.draw(pass);
        }
        
        pass.end();
    }
}
```

## API Design Patterns

### Builder Pattern
Trivalibs uses a fluent builder pattern that we'll preserve:

**Rust:**
```rust
let shape = painter.shape(form, shade)
    .with_bindings(bindings)
    .with_cull_mode(None)
    .create();
```

**TypeScript:**
```typescript
const shape = painter.shape(form, shader)
    .withBindings(bindings)
    .withCullMode(null)
    .create();
```

### Resource Handles
Instead of numeric indices, use type-safe handles:

**TypeScript:**
```typescript
export class ResourceHandle<T> {
    constructor(public readonly id: number, private phantom?: T) {}
}

export type FormHandle = ResourceHandle<Form>;
export type ShaderHandle = ResourceHandle<Shader>;
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create TypeScript project with WebGPU types
- [ ] Implement basic Painter class
- [ ] Add device initialization and error handling
- [ ] Create resource management system

### Phase 2: Resource System (Week 2-3)
- [ ] Implement Form system for geometry
- [ ] Create Shader system with WGSL support
- [ ] Add Binding system for uniforms
- [ ] Implement Texture management

### Phase 3: Rendering Pipeline (Week 3-4)
- [ ] Create Layer system for render targets
- [ ] Implement Shape rendering
- [ ] Add pipeline state management
- [ ] Support multisampling

### Phase 4: Application Framework (Week 4-5)
- [ ] Port CanvasApp interface
- [ ] Implement event system
- [ ] Add animation loop
- [ ] Create examples

## Code Examples

### Simple Triangle Example

**TypeScript Implementation:**
```typescript
import { Painter, CanvasApp, Event } from 'trivalibs-ts';
import { vec3, vec4, Mat4 } from 'trivalibs-ts/math';

const VERTICES = [
    vec3(0.0, 0.5, 0.0),
    vec3(-0.5, -0.5, 0.0),
    vec3(0.5, -0.5, 0.0)
];

class TriangleApp implements CanvasApp {
    private mvpMatrix: BindingBuffer<Mat4>;
    private colorBuffer: BindingBuffer<Vec4>;
    private layer: Layer;
    
    async init(painter: Painter): Promise<void> {
        // Create shader
        const shader = await painter.shader()
            .withVertexAttributes([VertexFormat.Float32x3])
            .withBindings([
                { type: 'uniform', visibility: 'vertex' },
                { type: 'uniform', visibility: 'fragment' }
            ])
            .withVertexSource(vertexShaderWGSL)
            .withFragmentSource(fragmentShaderWGSL)
            .create();
        
        // Create geometry
        const form = painter.form()
            .withVertices(VERTICES)
            .create();
        
        // Create bindings
        this.mvpMatrix = painter.bindMat4();
        this.colorBuffer = painter.bindVec4();
        
        // Create shape
        const shape = painter.shape(form, shader)
            .withBindings({
                0: this.mvpMatrix,
                1: this.colorBuffer
            })
            .create();
        
        // Create layer
        this.layer = painter.layer()
            .withSize(canvas.width, canvas.height)
            .withClearColor({ r: 0, g: 0, b: 0, a: 1 })
            .withShape(shape)
            .create();
        
        // Set initial values
        this.colorBuffer.update(vec4(1, 0, 0, 1));
    }
    
    update(painter: Painter, deltaTime: number): void {
        // Update transformations...
    }
    
    render(painter: Painter): void {
        painter.renderLayer(this.layer);
    }
    
    event(event: Event, painter: Painter): void {
        // Handle events...
    }
}

// Usage
const app = new TriangleApp();
const painter = new Painter();
await painter.init(canvas);
painter.runApp(app);
```

### Shader Example (WGSL)

**Vertex Shader:**
```wgsl
struct Uniforms {
    mvpMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
};

@vertex
fn main(@location(0) position: vec3<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.mvpMatrix * vec4<f32>(position, 1.0);
    return output;
}
```

**Fragment Shader:**
```wgsl
struct Color {
    value: vec4<f32>,
};

@group(0) @binding(1) var<uniform> color: Color;

@fragment
fn main() -> @location(0) vec4<f32> {
    return color.value;
}
```

## Shader Language Differences

### Rust-GPU vs WGSL

The current Rust implementation uses rust-gpu to compile shaders from Rust code:

**Rust-GPU Shader (current):**
```rust
#[spirv(vertex)]
pub fn vertex(
    position: Vec3,
    #[spirv(uniform, descriptor_set = 0, binding = 0)] vp_mat: &Mat4,
    #[spirv(uniform, descriptor_set = 0, binding = 1)] model_mat: &Mat4,
    #[spirv(position)] clip_pos: &mut Vec4,
) {
    *clip_pos = *vp_mat * *model_mat * position.extend(1.0);
}
```

**WGSL Shader (port):**
```wgsl
struct Uniforms {
    vpMatrix: mat4x4<f32>,
    modelMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
    return uniforms.vpMatrix * uniforms.modelMatrix * vec4<f32>(position, 1.0);
}
```

### Trade-offs

**Advantages of using WGSL:**
- Native WebGPU shader language
- Better tooling and debugging support in browsers
- Easier to understand for web developers
- No compilation step needed
- Smaller bundle size (no SPIR-V binaries)

**Disadvantages:**
- Cannot share math code between CPU and GPU
- Need to maintain separate shader files
- Less type safety

### Shader Organization

For the TypeScript port, we'll organize shaders as follows:

```
trivalibs-ts/
├── src/
│   └── shaders/
│       ├── basic.vert.wgsl
│       ├── basic.frag.wgsl
│       └── effects/
│           ├── blur.wgsl
│           └── ...
└── examples/
    └── shaders/
        ├── triangle.vert.wgsl
        └── triangle.frag.wgsl
```

## Migration Strategy

### 1. Start Simple
Begin with the most basic example (simple triangle) and gradually add features.

### 2. Maintain API Compatibility
Keep the API as similar as possible to the Rust version to ease migration.

### 3. Incremental Testing
Test each component thoroughly before moving to the next.

### 4. Performance Benchmarking
Compare performance with the WASM version at each milestone.

## Performance Optimizations

### 1. Buffer Management
- Use a single large buffer for all uniforms (UBO)
- Implement buffer suballocation
- Minimize buffer updates per frame

### 2. Pipeline Caching
- Cache pipeline states
- Reuse bind group layouts
- Minimize state changes

### 3. Draw Call Batching
- Group similar shapes
- Use instancing where possible
- Minimize render pass switches

### 4. Memory Management
- Pool temporary objects
- Use TypedArrays efficiently
- Avoid unnecessary allocations

### 5. Shader Optimization
- Pre-compile shaders
- Use shader variants sparingly
- Optimize uniform access patterns

## Next Steps

1. Set up the TypeScript project structure
2. Implement the core Painter class
3. Port the simple triangle example
4. Benchmark against WASM version
5. Iterate on performance optimizations

This document serves as the foundation for porting trivalibs to TypeScript, providing a clear roadmap and maintaining the elegant API design while leveraging native WebGPU performance.