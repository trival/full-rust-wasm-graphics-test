# Porting Trivalibs Painter to MoonBit/WebGPU

## Table of Contents
1. [Motivation and Performance Analysis](#motivation-and-performance-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Math Library Design](#math-library-design)
4. [WebGPU FFI Strategy](#webgpu-ffi-strategy)
5. [Core Components](#core-components)
6. [API Design Patterns](#api-design-patterns)
7. [Implementation Phases](#implementation-phases)
8. [Code Examples](#code-examples)
9. [Performance Guidelines](#performance-guidelines)
10. [Development Workflow](#development-workflow)

## Motivation and Performance Analysis

### Why MoonBit?

MoonBit offers a unique combination of features that make it compelling for porting trivalibs:

1. **Superior JavaScript Performance**:
   - MoonBit generates JavaScript that runs up to 25x faster than handwritten JS
   - No WASM boundary overhead when targeting JS
   - Instant compilation enables rapid iteration

2. **Dual Target Capability**:
   - Can compile to JavaScript for UI and non-critical paths
   - Can compile to WASM for compute-intensive operations
   - Gradual migration path from JS to WASM based on profiling

3. **Language Features**:
   - Operator overloading for ergonomic math operations
   - Trait system for polymorphic rendering abstractions
   - Pattern matching for elegant API design
   - Strong type system catches errors at compile time

4. **Development Experience**:
   - Integrates seamlessly with Vite ecosystem
   - Hot module reloading support
   - Small bundle sizes compared to Rust/WASM

### Performance Comparison

| Aspect | Rust/WASM | TypeScript | MoonBit/JS |
|--------|-----------|------------|------------|
| Bundle Size | 3MB+ | ~100KB | ~80KB |
| Runtime Speed | 1x (baseline) | 5-10x slower | 2-3x slower |
| Compilation Speed | Slow | Instant | Instant |
| FFI Overhead | High | None | None |
| Math Operations | Native | Interpreted | Optimized JS |

## Architecture Overview

### Package Structure

```
trivalibs-moonbit/
├── moon.mod.json                 # Module configuration
├── src/
│   ├── math/                     # Performance-focused math library
│   │   ├── moon.pkg.json
│   │   ├── vec2.mbt             # Mutable vec2 operations
│   │   ├── vec3.mbt
│   │   ├── vec4.mbt
│   │   ├── mat3.mbt
│   │   └── mat4.mbt
│   ├── webgpu/                   # WebGPU FFI bindings
│   │   ├── moon.pkg.json
│   │   ├── types.mbt            # WebGPU type definitions
│   │   ├── device.mbt           # Device & Queue bindings
│   │   ├── buffer.mbt           # Buffer management
│   │   ├── texture.mbt          # Texture handling
│   │   └── pipeline.mbt         # Pipeline & shaders
│   ├── core/                     # Core painter abstraction
│   │   ├── moon.pkg.json
│   │   ├── painter.mbt
│   │   ├── resources.mbt
│   │   └── builder.mbt
│   ├── rendering/                # Rendering components
│   │   ├── moon.pkg.json
│   │   ├── form.mbt
│   │   ├── shader.mbt
│   │   ├── shape.mbt
│   │   ├── layer.mbt
│   │   └── effect.mbt
│   └── app/                      # Application framework
│       ├── moon.pkg.json
│       ├── canvas_app.mbt
│       └── events.mbt
├── examples/
│   ├── simple-triangle/
│   ├── ball/
│   └── blur/
└── tests/
```

### Key Design Decisions

1. **Performance-First Math Library**:
   - Follow gl-matrix patterns: mutable operations by default
   - Provide both mutable and immutable APIs
   - Use operator overloading judiciously
   - Minimize allocations in hot paths

2. **FFI Efficiency**:
   - Batch WebGPU operations to minimize boundary crossings
   - Use opaque handles for GPU resources
   - Lazy initialization patterns
   - Command recording optimizations

3. **Builder Pattern Adaptation**:
   - Leverage MoonBit's method chaining
   - Use cascade operator `..` for mutations
   - Type-safe builders with phantom types

## Math Library Design

### Design Philosophy: WGSL-Compatible API with gl-matrix Performance

Our math library provides a WGSL-familiar API to minimize context switching between shader and application code, while internally following gl-matrix performance patterns:

1. **WGSL-like function names**: `dot()`, `cross()`, `normalize()`, `length()`, etc.
2. **Method syntax where appropriate**: `vec.normalize()` for chaining
3. **Free functions for binary operations**: `dot(a, b)`, `cross(a, b)`
4. **Mutable operations under the hood**: Following gl-matrix for performance

### Performance Principles

```moonbit
// WGSL-style API with gl-matrix implementation
// Functions that match WGSL built-ins are provided as both methods and free functions

// BAD: Creates new objects every time (naive functional style)
fn add_naive(a: Vec3, b: Vec3) -> Vec3 {
  Vec3::new(a.x + b.x, a.y + b.y, a.z + b.z)
}

// GOOD: Mutable operation with WGSL-like API
pub fn add(a: Vec3, b: Vec3) -> Vec3 {
  a.clone().add_mut(b)  // Clone then mutate for safety
}

// BETTER: Method chaining for performance-critical code
fn update_position(pos: Vec3, velocity: Vec3, dt: Float) -> Vec3 {
  pos.add_mut(velocity.clone().scale(dt))  // In-place update
}
```

### Vector Types

```moonbit
// Vec3 with mutable fields for performance
pub struct Vec3 {
  mut x: Float
  mut y: Float
  mut z: Float
}

// Core implementation with mutable operations
impl Vec3 {
  // Constructors matching WGSL
  pub fn new(x: Float, y: Float, z: Float) -> Vec3 { Vec3 { x, y, z } }
  pub fn splat(v: Float) -> Vec3 { Vec3::new(v, v, v) }
  pub fn zero() -> Vec3 { Vec3::new(0.0, 0.0, 0.0) }
  pub fn one() -> Vec3 { Vec3::new(1.0, 1.0, 1.0) }
  
  // Mutable operations (return self for chaining)
  pub fn add_mut(self: Vec3, other: Vec3) -> Vec3 {
    self.x += other.x
    self.y += other.y
    self.z += other.z
    self
  }
  
  pub fn sub_mut(self: Vec3, other: Vec3) -> Vec3 {
    self.x -= other.x
    self.y -= other.y
    self.z -= other.z
    self
  }
  
  pub fn scale(self: Vec3, s: Float) -> Vec3 {
    self.x *= s
    self.y *= s
    self.z *= s
    self
  }
  
  // WGSL-compatible methods
  pub fn length(self: Vec3) -> Float {
    sqrt(self.x * self.x + self.y * self.y + self.z * self.z)
  }
  
  pub fn length_squared(self: Vec3) -> Float {
    self.x * self.x + self.y * self.y + self.z * self.z
  }
  
  pub fn normalize(self: Vec3) -> Vec3 {
    let len = self.length()
    if len > 0.0 {
      self.scale(1.0 / len)
    }
    self
  }
  
  pub fn distance(self: Vec3, other: Vec3) -> Float {
    let dx = self.x - other.x
    let dy = self.y - other.y
    let dz = self.z - other.z
    sqrt(dx * dx + dy * dy + dz * dz)
  }
  
  // Immutable operations for safety
  pub fn normalized(self: Vec3) -> Vec3 {
    self.clone().normalize()
  }
}

// WGSL-style free functions (matching shader built-ins)
pub fn vec3(x: Float, y: Float, z: Float) -> Vec3 { Vec3::new(x, y, z) }

pub fn dot(a: Vec3, b: Vec3) -> Float {
  a.x * b.x + a.y * b.y + a.z * b.z
}

pub fn cross(a: Vec3, b: Vec3) -> Vec3 {
  Vec3::new(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  )
}

pub fn reflect(i: Vec3, n: Vec3) -> Vec3 {
  // i - 2.0 * dot(n, i) * n
  i.clone().sub_mut(n.clone().scale(2.0 * dot(n, i)))
}

pub fn refract(i: Vec3, n: Vec3, eta: Float) -> Vec3 {
  let n_dot_i = dot(n, i)
  let k = 1.0 - eta * eta * (1.0 - n_dot_i * n_dot_i)
  if k < 0.0 {
    Vec3::zero()
  } else {
    i.clone().scale(eta).sub_mut(n.clone().scale(eta * n_dot_i + sqrt(k)))
  }
}

pub fn mix(a: Vec3, b: Vec3, t: Float) -> Vec3 {
  // WGSL mix function: a * (1 - t) + b * t
  Vec3::new(
    a.x * (1.0 - t) + b.x * t,
    a.y * (1.0 - t) + b.y * t,
    a.z * (1.0 - t) + b.z * t
  )
}

pub fn clamp(v: Vec3, min: Vec3, max: Vec3) -> Vec3 {
  Vec3::new(
    clamp_scalar(v.x, min.x, max.x),
    clamp_scalar(v.y, min.y, max.y),
    clamp_scalar(v.z, min.z, max.z)
  )
}

pub fn step(edge: Vec3, v: Vec3) -> Vec3 {
  Vec3::new(
    if v.x < edge.x { 0.0 } else { 1.0 },
    if v.y < edge.y { 0.0 } else { 1.0 },
    if v.z < edge.z { 0.0 } else { 1.0 }
  )
}

pub fn smoothstep(edge0: Vec3, edge1: Vec3, v: Vec3) -> Vec3 {
  let t = clamp((v.clone().sub_mut(edge0.clone())).div_components(edge1.clone().sub_mut(edge0.clone())), 
                Vec3::zero(), Vec3::one())
  Vec3::new(
    t.x * t.x * (3.0 - 2.0 * t.x),
    t.y * t.y * (3.0 - 2.0 * t.y),
    t.z * t.z * (3.0 - 2.0 * t.z)
  )
}

// Component-wise operations (matching WGSL)
pub fn abs(v: Vec3) -> Vec3 {
  Vec3::new(abs_scalar(v.x), abs_scalar(v.y), abs_scalar(v.z))
}

pub fn floor(v: Vec3) -> Vec3 {
  Vec3::new(floor_scalar(v.x), floor_scalar(v.y), floor_scalar(v.z))
}

pub fn ceil(v: Vec3) -> Vec3 {
  Vec3::new(ceil_scalar(v.x), ceil_scalar(v.y), ceil_scalar(v.z))
}

pub fn fract(v: Vec3) -> Vec3 {
  Vec3::new(v.x - floor_scalar(v.x), v.y - floor_scalar(v.y), v.z - floor_scalar(v.z))
}

pub fn sin(v: Vec3) -> Vec3 {
  Vec3::new(sin_scalar(v.x), sin_scalar(v.y), sin_scalar(v.z))
}

pub fn cos(v: Vec3) -> Vec3 {
  Vec3::new(cos_scalar(v.x), cos_scalar(v.y), cos_scalar(v.z))
}

// Operator overloading for convenience (but not in hot paths)
impl Add for Vec3 {
  add(self: Vec3, other: Vec3) -> Vec3 { self.clone().add_mut(other) }
}

impl Sub for Vec3 {
  sub(self: Vec3, other: Vec3) -> Vec3 { self.clone().sub_mut(other) }
}

impl Mul for Vec3 {
  mul(self: Vec3, scalar: Float) -> Vec3 { self.clone().scale(scalar) }
}

// Vec2 and Vec4 follow the same pattern
pub struct Vec2 { mut x: Float, mut y: Float }
pub struct Vec4 { mut x: Float, mut y: Float, mut z: Float, mut w: Float }

// WGSL-style constructors
pub fn vec2(x: Float, y: Float) -> Vec2 { Vec2::new(x, y) }
pub fn vec4(x: Float, y: Float, z: Float, w: Float) -> Vec4 { Vec4::new(x, y, z, w) }
```

### Matrix Types

```moonbit
// Mat4 stored in column-major order (like gl-matrix and WGSL)
pub struct Mat4 {
  mut data: FixedArray[Float, 16]
}

impl Mat4 {
  // WGSL-compatible constructors
  pub fn identity() -> Mat4 {
    let mut m = Mat4 { data: FixedArray::make(16, 0.0) }
    m.data[0] = 1.0
    m.data[5] = 1.0
    m.data[10] = 1.0
    m.data[15] = 1.0
    m
  }
  
  pub fn zero() -> Mat4 {
    Mat4 { data: FixedArray::make(16, 0.0) }
  }
  
  // Mutable operations for performance
  pub fn multiply_mut(self: Mat4, other: Mat4) -> Mat4 {
    // gl-matrix style in-place multiplication
    let a = self.data
    let b = other.data
    let mut out = FixedArray::make(16, 0.0)
    
    // Unrolled for performance (following gl-matrix)
    let b0 = b[0]; let b1 = b[1]; let b2 = b[2]; let b3 = b[3]
    out[0] = b0*a[0] + b1*a[4] + b2*a[8] + b3*a[12]
    out[1] = b0*a[1] + b1*a[5] + b2*a[9] + b3*a[13]
    out[2] = b0*a[2] + b1*a[6] + b2*a[10] + b3*a[14]
    out[3] = b0*a[3] + b1*a[7] + b2*a[11] + b3*a[15]
    // ... continue for all 16 elements
    
    self.data = out
    self
  }
  
  pub fn translate(self: Mat4, v: Vec3) -> Mat4 {
    // In-place translation following gl-matrix
    let x = v.x; let y = v.y; let z = v.z
    self.data[12] = self.data[0] * x + self.data[4] * y + self.data[8] * z + self.data[12]
    self.data[13] = self.data[1] * x + self.data[5] * y + self.data[9] * z + self.data[13]
    self.data[14] = self.data[2] * x + self.data[6] * y + self.data[10] * z + self.data[14]
    self.data[15] = self.data[3] * x + self.data[7] * y + self.data[11] * z + self.data[15]
    self
  }
  
  pub fn scale(self: Mat4, v: Vec3) -> Mat4 {
    let x = v.x; let y = v.y; let z = v.z
    self.data[0] *= x; self.data[1] *= x; self.data[2] *= x; self.data[3] *= x
    self.data[4] *= y; self.data[5] *= y; self.data[6] *= y; self.data[7] *= y
    self.data[8] *= z; self.data[9] *= z; self.data[10] *= z; self.data[11] *= z
    self
  }
  
  pub fn rotate(self: Mat4, angle: Float, axis: Vec3) -> Mat4 {
    // Implementation following gl-matrix rotate
    // ...
    self
  }
  
  // WGSL-compatible utility methods
  pub fn determinant(self: Mat4) -> Float {
    // Calculate determinant
  }
  
  pub fn inverse(self: Mat4) -> Mat4? {
    // Return None if not invertible
  }
  
  pub fn transpose(self: Mat4) -> Mat4 {
    // In-place transpose
    self
  }
}

// WGSL-style free functions
pub fn mat4x4(
  c0: Vec4, c1: Vec4, c2: Vec4, c3: Vec4
) -> Mat4 {
  // Construct from column vectors
}

// Matrix construction helpers (matching WGSL patterns)
pub fn perspective(fovy: Float, aspect: Float, near: Float, far: Float) -> Mat4 {
  // gl-matrix perspective implementation
}

pub fn ortho(left: Float, right: Float, bottom: Float, top: Float, near: Float, far: Float) -> Mat4 {
  // gl-matrix ortho implementation
}

pub fn look_at(eye: Vec3, center: Vec3, up: Vec3) -> Mat4 {
  // gl-matrix lookAt implementation
}

// Matrix * Vector (matching WGSL syntax)
impl Mul[Vec4] for Mat4 {
  mul(self: Mat4, v: Vec4) -> Vec4 {
    let m = self.data
    Vec4::new(
      m[0]*v.x + m[4]*v.y + m[8]*v.z + m[12]*v.w,
      m[1]*v.x + m[5]*v.y + m[9]*v.z + m[13]*v.w,
      m[2]*v.x + m[6]*v.y + m[10]*v.z + m[14]*v.w,
      m[3]*v.x + m[7]*v.y + m[11]*v.z + m[15]*v.w
    )
  }
}

// Common shader-like operations
pub fn transform_point(m: Mat4, p: Vec3) -> Vec3 {
  let v4 = m * vec4(p.x, p.y, p.z, 1.0)
  vec3(v4.x / v4.w, v4.y / v4.w, v4.z / v4.w)
}

pub fn transform_direction(m: Mat4, d: Vec3) -> Vec3 {
  let v4 = m * vec4(d.x, d.y, d.z, 0.0)
  vec3(v4.x, v4.y, v4.z)
}
```

### WGSL Compatibility Reference

```moonbit
// Common operations that match WGSL built-ins:

// Trigonometric functions
pub fn radians(degrees: Float) -> Float { degrees * PI / 180.0 }
pub fn degrees(radians: Float) -> Float { radians * 180.0 / PI }
pub fn sin(angle: Float) -> Float { ... }
pub fn cos(angle: Float) -> Float { ... }
pub fn tan(angle: Float) -> Float { ... }
pub fn asin(x: Float) -> Float { ... }
pub fn acos(x: Float) -> Float { ... }
pub fn atan(y_over_x: Float) -> Float { ... }
pub fn atan2(y: Float, x: Float) -> Float { ... }

// Exponential functions
pub fn pow(x: Float, y: Float) -> Float { ... }
pub fn exp(x: Float) -> Float { ... }
pub fn log(x: Float) -> Float { ... }
pub fn exp2(x: Float) -> Float { ... }
pub fn log2(x: Float) -> Float { ... }
pub fn sqrt(x: Float) -> Float { ... }
pub fn inversesqrt(x: Float) -> Float { 1.0 / sqrt(x) }

// Common functions
pub fn abs(x: Float) -> Float { if x < 0.0 { -x } else { x } }
pub fn sign(x: Float) -> Float { if x < 0.0 { -1.0 } else if x > 0.0 { 1.0 } else { 0.0 } }
pub fn floor(x: Float) -> Float { ... }
pub fn ceil(x: Float) -> Float { ... }
pub fn fract(x: Float) -> Float { x - floor(x) }
pub fn mod(x: Float, y: Float) -> Float { x - y * floor(x / y) }
pub fn min(x: Float, y: Float) -> Float { if x < y { x } else { y } }
pub fn max(x: Float, y: Float) -> Float { if x > y { x } else { y } }
pub fn clamp(x: Float, min_val: Float, max_val: Float) -> Float { min(max(x, min_val), max_val) }
pub fn mix(x: Float, y: Float, a: Float) -> Float { x * (1.0 - a) + y * a }
pub fn step(edge: Float, x: Float) -> Float { if x < edge { 0.0 } else { 1.0 } }
pub fn smoothstep(edge0: Float, edge1: Float, x: Float) -> Float {
  let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0)
  t * t * (3.0 - 2.0 * t)
}
```

### Memory Layout Considerations

For WebGPU compatibility, we need proper alignment following WGSL std140 layout rules:

```moonbit
// Aligned types for GPU buffers
pub struct Vec3Aligned {
  mut x: Float
  mut y: Float
  mut z: Float
  mut _padding: Float  // Ensure 16-byte alignment
}

// Mat3 requires special padding - each column is a vec4!
pub struct Mat3Aligned {
  mut data: FixedArray[Float, 12]  // 3 columns × 4 floats each
}

pub struct Mat4Aligned {
  mut data: FixedArray[Float, 16]  // Already properly aligned
}

// Mat3 implementation with proper alignment
impl Mat3 {
  // Convert to GPU-compatible layout
  pub fn to_aligned(self: Mat3) -> Mat3Aligned {
    let mut aligned = Mat3Aligned { data: FixedArray::make(12, 0.0) }
    
    // Column 0 (with padding)
    aligned.data[0] = self.data[0]  // m00
    aligned.data[1] = self.data[1]  // m01
    aligned.data[2] = self.data[2]  // m02
    aligned.data[3] = 0.0           // padding
    
    // Column 1 (with padding)
    aligned.data[4] = self.data[3]  // m10
    aligned.data[5] = self.data[4]  // m11
    aligned.data[6] = self.data[5]  // m12
    aligned.data[7] = 0.0           // padding
    
    // Column 2 (with padding)
    aligned.data[8] = self.data[6]  // m20
    aligned.data[9] = self.data[7]  // m21
    aligned.data[10] = self.data[8] // m22
    aligned.data[11] = 0.0          // padding
    
    aligned
  }
  
  pub fn to_bytes(self: Mat3) -> Bytes {
    self.to_aligned().data.to_bytes()
  }
}

// Vec3 alignment helpers
impl Vec3 {
  pub fn to_aligned(self: Vec3) -> Vec3Aligned {
    Vec3Aligned { x: self.x, y: self.y, z: self.z, _padding: 0.0 }
  }
  
  pub fn to_bytes(self: Vec3) -> Bytes {
    let aligned = self.to_aligned()
    // Convert to bytes...
  }
}

// WGSL uniform buffer layout reference:
/*
// In WGSL:
struct Uniforms {
  model: mat3x3<f32>,  // Takes 48 bytes (3 × vec4)
  color: vec3<f32>,    // Takes 16 bytes (vec3 + padding)
  mvp: mat4x4<f32>,    // Takes 64 bytes (already aligned)
}

// In MoonBit:
pub struct Uniforms {
  model: Mat3Aligned,  // 48 bytes
  color: Vec3Aligned,  // 16 bytes  
  mvp: Mat4Aligned,    // 64 bytes
}
*/

// Helper for creating uniform buffers
pub fn create_uniform_buffer[T](painter: Painter, data: T) -> BufferId {
  let bytes = match data {
    Mat3 => data.to_bytes()     // Handles padding
    Vec3 => data.to_bytes()     // Handles padding
    Mat4 => data.to_bytes()     // Already aligned
    _ => serialize_for_gpu(data)
  }
  
  let buffer = gpu_device_create_buffer(painter.device, {
    size: bytes.length(),
    usage: GPUBufferUsage::UNIFORM | GPUBufferUsage::COPY_DST,
    mapped_at_creation: true
  })
  
  gpu_buffer_write(buffer, bytes)
  painter.add_buffer(buffer)
}
```

## WebGPU FFI Strategy

### Type Definitions

```moonbit
// Opaque handle types for GPU resources
type GPUDevice = ExternRef
type GPUQueue = ExternRef
type GPUBuffer = ExternRef
type GPUTexture = ExternRef
type GPUBindGroup = ExternRef
type GPURenderPipeline = ExternRef
type GPUCommandEncoder = ExternRef
type GPURenderPassEncoder = ExternRef

// Enums represented as strings
type GPUTextureFormat = String
type GPUBufferUsage = Int
type GPUTextureUsage = Int

// Descriptor types using MoonBit structs
pub struct GPUBufferDescriptor {
  label: String?
  size: Int
  usage: GPUBufferUsage
  mapped_at_creation: Bool
}
```

### FFI Bindings

```moonbit
// Device creation
extern "js" fn gpu_request_adapter() -> Promise[ExternRef] =
  #| () => navigator.gpu.requestAdapter()

extern "js" fn gpu_adapter_request_device(adapter: ExternRef) -> Promise[GPUDevice] =
  #| (adapter) => adapter.requestDevice()

// Buffer operations
extern "js" fn gpu_device_create_buffer(
  device: GPUDevice, 
  desc: GPUBufferDescriptor
) -> GPUBuffer =
  #| (device, desc) => device.createBuffer({
  #|   label: desc.label,
  #|   size: desc.size,
  #|   usage: desc.usage,
  #|   mappedAtCreation: desc.mapped_at_creation
  #| })

extern "js" fn gpu_queue_write_buffer(
  queue: GPUQueue,
  buffer: GPUBuffer,
  offset: Int,
  data: Bytes
) -> Unit =
  #| (queue, buffer, offset, data) => queue.writeBuffer(buffer, offset, data)

// Render pass operations
extern "js" fn gpu_render_pass_set_pipeline(
  pass: GPURenderPassEncoder,
  pipeline: GPURenderPipeline
) -> Unit =
  #| (pass, pipeline) => pass.setPipeline(pipeline)

extern "js" fn gpu_render_pass_draw(
  pass: GPURenderPassEncoder,
  vertex_count: Int
) -> Unit =
  #| (pass, count) => pass.draw(count)
```

### Resource Management

```moonbit
// WebGPU resource wrapper with lifecycle management
pub struct WebGPUResource[T] {
  handle: T
  mut destroyed: Bool
}

impl[T] WebGPUResource[T] {
  pub fn new(handle: T) -> WebGPUResource[T] {
    WebGPUResource { handle, destroyed: false }
  }
  
  pub fn destroy(self: WebGPUResource[T]) -> Unit {
    if not(self.destroyed) {
      // Call appropriate destroy method via FFI
      self.destroyed = true
    }
  }
}

// Automatic cleanup with RAII pattern
pub fn with_command_encoder(device: GPUDevice, f: (GPUCommandEncoder) -> Unit) -> Unit {
  let encoder = gpu_device_create_command_encoder(device)
  f(encoder)
  gpu_command_encoder_finish(encoder)
}
```

### Async Handling

```moonbit
// Promise wrapper for MoonBit
type Promise[T] = ExternRef

extern "js" fn promise_then[T, U](
  promise: Promise[T],
  callback: (T) -> U
) -> Promise[U] =
  #| (promise, callback) => promise.then(callback)

// Async initialization pattern
pub fn init_webgpu(canvas: ExternRef) -> Promise[Painter] {
  gpu_request_adapter()
    |> promise_then(fn(adapter) { gpu_adapter_request_device(adapter) })
    |> promise_then(fn(device) { 
      let queue = gpu_device_get_queue(device)
      let context = gpu_canvas_get_context(canvas)
      Painter::new(device, queue, context)
    })
}
```

## Core Components

### 1. Painter Class

The main renderer managing WebGPU resources:

```moonbit
pub struct Painter {
  device: GPUDevice
  queue: GPUQueue
  context: GPUCanvasContext
  format: GPUTextureFormat
  
  // Resource storage
  mut forms: Array[Form]
  mut shaders: Array[Shader]
  mut textures: Array[WebGPUResource[GPUTexture]]
  mut buffers: Array[WebGPUResource[GPUBuffer]]
  mut bind_group_layouts: Array[GPUBindGroupLayout]
  mut pipelines: Map[String, GPURenderPipeline]
}

impl Painter {
  pub fn new(device: GPUDevice, queue: GPUQueue, context: GPUCanvasContext) -> Painter {
    let format = gpu_get_preferred_canvas_format()
    gpu_context_configure(context, device, format)
    
    Painter {
      device, queue, context, format,
      forms: Array::new(),
      shaders: Array::new(),
      textures: Array::new(),
      buffers: Array::new(),
      bind_group_layouts: Array::new(),
      pipelines: Map::new()
    }
  }
  
  // Builder methods
  pub fn form(self: Painter) -> FormBuilder { FormBuilder::new(self) }
  pub fn shader(self: Painter) -> ShaderBuilder { ShaderBuilder::new(self) }
  pub fn shape(self: Painter, form: FormId, shader: ShaderId) -> ShapeBuilder { ... }
  pub fn layer(self: Painter) -> LayerBuilder { ... }
  
  // Resource management
  pub fn add_buffer(self: Painter, buffer: GPUBuffer) -> BufferId { ... }
  pub fn add_texture(self: Painter, texture: GPUTexture) -> TextureId { ... }
  
  // Rendering
  pub fn render_layer(self: Painter, layer: Layer) -> Unit { ... }
}
```

### 2. Form System (Geometry)

```moonbit
pub struct Form {
  vertex_buffer: BufferId
  index_buffer: BufferId?
  vertex_count: Int
  index_count: Int
  topology: GPUPrimitiveTopology
}

pub struct FormBuilder {
  painter: Painter
  mut vertices: Bytes?
  mut indices: Bytes?
  mut vertex_count: Int
  mut topology: GPUPrimitiveTopology
}

impl FormBuilder {
  pub fn with_vertices[T](self: FormBuilder, vertices: Array[T]) -> FormBuilder {
    // Convert vertices to bytes
    let bytes = serialize_vertices(vertices)
    self.vertices = Some(bytes)
    self.vertex_count = vertices.length()
    self
  }
  
  pub fn with_indices(self: FormBuilder, indices: Array[UInt]) -> FormBuilder {
    self.indices = Some(serialize_indices(indices))
    self
  }
  
  pub fn create(self: FormBuilder) -> Form {
    let vertex_buffer = create_vertex_buffer(self.painter, self.vertices.unwrap())
    let index_buffer = self.indices.map(fn(data) { 
      create_index_buffer(self.painter, data) 
    })
    
    Form {
      vertex_buffer,
      index_buffer,
      vertex_count: self.vertex_count,
      index_count: self.indices.map(fn(i) { i.length() / 4 }).unwrap_or(0),
      topology: self.topology
    }
  }
}
```

### 3. Shader System

```moonbit
pub struct Shader {
  vertex_module: GPUShaderModule
  fragment_module: GPUShaderModule
  bind_group_layouts: Array[GPUBindGroupLayout]
  vertex_attributes: Array[GPUVertexAttribute]
}

pub struct ShaderBuilder {
  painter: Painter
  mut vertex_source: String?
  mut fragment_source: String?
  mut vertex_attributes: Array[GPUVertexFormat]
  mut bindings: Array[BindingLayout]
}

impl ShaderBuilder {
  pub fn with_vertex_source(self: ShaderBuilder, wgsl: String) -> ShaderBuilder {
    self.vertex_source = Some(wgsl)
    self
  }
  
  pub fn with_fragment_source(self: ShaderBuilder, wgsl: String) -> ShaderBuilder {
    self.fragment_source = Some(wgsl)
    self
  }
  
  pub fn with_vertex_attributes(self: ShaderBuilder, attrs: Array[GPUVertexFormat]) -> ShaderBuilder {
    self.vertex_attributes = attrs
    self
  }
  
  pub fn create(self: ShaderBuilder) -> Shader {
    let vertex_module = gpu_device_create_shader_module(
      self.painter.device,
      self.vertex_source.unwrap()
    )
    
    let fragment_module = gpu_device_create_shader_module(
      self.painter.device,
      self.fragment_source.unwrap()
    )
    
    // Create bind group layouts from bindings
    let layouts = create_bind_group_layouts(self.painter, self.bindings)
    
    Shader {
      vertex_module,
      fragment_module,
      bind_group_layouts: layouts,
      vertex_attributes: convert_vertex_attributes(self.vertex_attributes)
    }
  }
}
```

### 4. Binding System

```moonbit
pub struct BindingBuffer[T] {
  painter: Painter
  buffer_id: BufferId
  size: Int
  mut cached_value: T?
}

impl[T] BindingBuffer[T] {
  pub fn update(self: BindingBuffer[T], value: T) -> Unit {
    self.cached_value = Some(value)
    let bytes = serialize_for_gpu(value)
    let buffer = self.painter.get_buffer(self.buffer_id)
    gpu_queue_write_buffer(self.painter.queue, buffer, 0, bytes)
  }
}

// Factory methods on Painter
impl Painter {
  pub fn bind_mat4(self: Painter) -> BindingBuffer[Mat4] {
    let buffer = create_uniform_buffer(self, 64)
    BindingBuffer {
      painter: self,
      buffer_id: self.add_buffer(buffer),
      size: 64,
      cached_value: None
    }
  }
  
  pub fn bind_mat3(self: Painter) -> BindingBuffer[Mat3] {
    let buffer = create_uniform_buffer(self, 48) // 3 × vec4 (16 bytes each)
    BindingBuffer {
      painter: self,
      buffer_id: self.add_buffer(buffer),
      size: 48,
      cached_value: None,
      // Custom serializer for Mat3 padding
      serialize: fn(mat: Mat3) -> Bytes { mat.to_bytes() }
    }
  }
  
  pub fn bind_vec3(self: Painter) -> BindingBuffer[Vec3] {
    let buffer = create_uniform_buffer(self, 16) // Aligned to 16 bytes
    BindingBuffer {
      painter: self,
      buffer_id: self.add_buffer(buffer),
      size: 16,
      cached_value: None,
      serialize: fn(vec: Vec3) -> Bytes { vec.to_bytes() }
    }
  }
  
  pub fn bind_vec2(self: Painter) -> BindingBuffer[Vec2] {
    let buffer = create_uniform_buffer(self, 8) // No padding needed
    BindingBuffer {
      painter: self,
      buffer_id: self.add_buffer(buffer),
      size: 8,
      cached_value: None
    }
  }
}
```

### 5. Layer System

```moonbit
pub struct Layer {
  painter: Painter
  target_textures: Array[TextureId]
  current_target: Int
  shapes: Array[Shape]
  effects: Array[Effect]
  props: LayerProps
}

pub struct LayerProps {
  width: Int
  height: Int
  use_window_size: Bool
  clear_color: GPUColor
  depth_test: Bool
  multisampling: Bool
}

impl Layer {
  fn render(self: Layer, encoder: GPUCommandEncoder) -> Unit {
    match (self.shapes.is_empty(), self.effects.is_empty()) {
      (false, true) => self.render_shapes_only(encoder)
      (true, false) => self.render_effects_only(encoder)
      (false, false) => self.render_shapes_with_effects(encoder)
      (true, true) => ()
    }
  }
  
  fn render_shapes_only(self: Layer, encoder: GPUCommandEncoder) -> Unit {
    let render_pass = begin_render_pass(encoder, self.get_render_target())
    
    for shape in self.shapes {
      shape.draw(render_pass)
    }
    
    gpu_render_pass_end(render_pass)
  }
}
```

## API Design Patterns

### Builder Pattern with Cascade Operator

MoonBit's cascade operator `..` is perfect for builders:

```moonbit
// Traditional chaining
let shape = painter.shape(form_id, shader_id)
  .with_bindings(bindings)
  .with_cull_mode(CullMode::Back)
  .create()

// Using cascade operator
let shape = ShapeBuilder::new(painter, form_id, shader_id)
  ..with_bindings(bindings)
  ..with_cull_mode(CullMode::Back)
  ..create()

// Even more concise with method chaining
let layer = painter.layer()
  ..with_size(800, 600)
  ..with_clear_color({ r: 0.0, g: 0.0, b: 0.0, a: 1.0 })
  ..with_shapes([shape1, shape2])
  ..with_effects([blur_effect])
  ..create()
```

### Resource Handles

Type-safe resource handles using phantom types:

```moonbit
pub enum ResourceId[T] {
  Id(Int)
}

pub type FormId = ResourceId[Form]
pub type ShaderId = ResourceId[Shader]
pub type TextureId = ResourceId[GPUTexture]
pub type BufferId = ResourceId[GPUBuffer]

// Usage
fn get_form(self: Painter, id: FormId) -> Form {
  match id {
    ResourceId::Id(index) => self.forms[index]
  }
}
```

### Error Handling

Using MoonBit's Result type for fallible operations:

```moonbit
pub enum WebGPUError {
  DeviceNotFound
  ShaderCompilationError(String)
  BufferCreationError(String)
  OutOfMemory
}

pub fn init_painter(canvas: ExternRef) -> Result[Painter, WebGPUError] {
  // Implementation with proper error handling
}

// Usage with pattern matching
match init_painter(canvas) {
  Ok(painter) => run_app(painter)
  Err(DeviceNotFound) => show_error("WebGPU not supported")
  Err(error) => show_error(error.to_string())
}
```

## Implementation Phases

### Phase 1: Math Library (Week 1)
- [x] Design performance-focused API following gl-matrix
- [ ] Implement Vec2, Vec3, Vec4 with mutable operations
- [ ] Implement Mat3, Mat4 with common transformations
- [ ] Add operator overloading for ergonomics
- [ ] Create comprehensive test suite
- [ ] Benchmark against gl-matrix

### Phase 2: WebGPU FFI Bindings (Week 2)
- [ ] Define opaque handle types for GPU resources
- [ ] Create device and queue bindings
- [ ] Implement buffer creation and management
- [ ] Add texture and sampler bindings
- [ ] Create pipeline and shader module bindings
- [ ] Handle async initialization

### Phase 3: Core Painter (Week 3)
- [ ] Implement Painter class with resource management
- [ ] Create Form system for geometry
- [ ] Add Shader system with WGSL support
- [ ] Implement binding system for uniforms
- [ ] Port simple triangle example
- [ ] Verify rendering works correctly

### Phase 4: Rendering Pipeline (Week 4)
- [ ] Implement Layer system with render targets
- [ ] Add Shape rendering with state management
- [ ] Create Effect system for post-processing
- [ ] Support multisampling and depth testing
- [ ] Add texture management
- [ ] Implement command batching

### Phase 5: Examples and Polish (Week 5)
- [ ] Port ball example with textures
- [ ] Port blur effect example
- [ ] Add comprehensive documentation
- [ ] Performance profiling and optimization
- [ ] Create development guide
- [ ] Package for distribution

## Code Examples

### Simple Triangle Example

```moonbit
// vertex shader (WGSL)
let vertex_shader = """
struct Uniforms {
  mvp_matrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return uniforms.mvp_matrix * vec4<f32>(position, 1.0);
}
"""

// fragment shader (WGSL)
let fragment_shader = """
@fragment
fn main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0); // red
}
"""

// MoonBit application
pub struct TriangleApp {
  mut mvp_matrix: BindingBuffer[Mat4]
  mut layer: Layer
}

impl CanvasApp for TriangleApp {
  fn init(self: TriangleApp, painter: Painter) -> Result[Unit, String] {
    // Create geometry
    let vertices = [
      Vec3::new(0.0, 0.5, 0.0),
      Vec3::new(-0.5, -0.5, 0.0),
      Vec3::new(0.5, -0.5, 0.0)
    ]
    
    let form = painter.form()
      ..with_vertices(vertices)
      ..create()
    
    // Create shader
    let shader = painter.shader()
      ..with_vertex_attributes([VertexFormat::Float32x3])
      ..with_vertex_source(vertex_shader)
      ..with_fragment_source(fragment_shader)
      ..with_bindings([
        BindingLayout::uniform(ShaderStage::Vertex)
      ])
      ..create()
    
    // Create bindings
    self.mvp_matrix = painter.bind_mat4()
    
    // Create shape
    let shape = painter.shape(form.id, shader.id)
      ..with_bindings({
        0: self.mvp_matrix
      })
      ..create()
    
    // Create layer
    self.layer = painter.layer()
      ..with_window_size()
      ..with_clear_color({ r: 0.0, g: 0.0, b: 0.0, a: 1.0 })
      ..with_shape(shape)
      ..create()
    
    // Set initial matrix
    let mvp = Mat4::identity()
    self.mvp_matrix.update(mvp)
    
    Ok(())
  }
  
  fn render(self: TriangleApp, painter: Painter) -> Unit {
    painter.render_layer(self.layer)
  }
}

// Entry point
pub fn main() -> Unit {
  let canvas = get_canvas_element("render-canvas")
  
  init_webgpu(canvas) |> promise_then(fn(painter) {
    match painter {
      Ok(p) => {
        let app = TriangleApp { mvp_matrix: None, layer: None }
        run_app(p, app)
      }
      Err(e) => console_error("Failed to initialize WebGPU: " + e.to_string())
    }
  })
}
```

### Math Operations Example

```moonbit
// WGSL-style code that works in both shader and application
fn calculate_lighting(
  position: Vec3,
  normal: Vec3,
  light_pos: Vec3,
  view_pos: Vec3
) -> Float {
  // These operations mirror WGSL exactly
  let light_dir = normalize(light_pos - position)
  let view_dir = normalize(view_pos - position)
  let halfway_dir = normalize(light_dir + view_dir)
  
  // WGSL built-in functions
  let diffuse = max(dot(normal, light_dir), 0.0)
  let specular = pow(max(dot(normal, halfway_dir), 0.0), 32.0)
  
  diffuse + specular
}

// Performance-focused operations using mutable methods
fn update_particle_system(particles: Array[Particle], dt: Float) -> Unit {
  for particle in particles {
    // Method chaining with in-place mutations
    particle.position
      .add_mut(particle.velocity.clone().scale(dt))  // vel * dt
    
    particle.velocity
      .add_mut(gravity.clone().scale(dt))           // apply gravity
      .scale(0.99)                                   // damping
    
    // WGSL-style clamp
    particle.position = clamp(particle.position, bounds_min, bounds_max)
  }
}

// Matrix operations matching WGSL patterns
fn setup_camera(eye: Vec3, target: Vec3, aspect: Float) -> Mat4 {
  // WGSL-like construction
  let view = look_at(eye, target, vec3(0.0, 1.0, 0.0))
  let proj = perspective(radians(45.0), aspect, 0.1, 1000.0)
  
  // Matrix multiplication (creates new)
  proj * view
}

// Shader-like operations in application code
fn apply_displacement(vertex: Vec3, time: Float) -> Vec3 {
  // WGSL-compatible noise calculation
  let frequency = 2.0
  let amplitude = 0.1
  
  let offset = vec3(
    sin(vertex.x * frequency + time),
    cos(vertex.y * frequency + time * 0.7),
    sin(vertex.z * frequency + time * 1.3)
  )
  
  vertex + offset * amplitude
}

// Compare with equivalent WGSL shader code:
/*
fn vertex_main(
  @location(0) position: vec3<f32>,
  @builtin(vertex_index) vertex_index: u32
) -> @builtin(position) vec4<f32> {
  let frequency = 2.0;
  let amplitude = 0.1;
  
  let offset = vec3<f32>(
    sin(position.x * frequency + uniforms.time),
    cos(position.y * frequency + uniforms.time * 0.7),
    sin(position.z * frequency + uniforms.time * 1.3)
  );
  
  let displaced = position + offset * amplitude;
  return uniforms.mvp * vec4<f32>(displaced, 1.0);
}
*/
```

## Performance Guidelines

### 1. Math Operations

**DO:**
- Use mutable operations in hot loops
- Chain operations to avoid temporaries
- Preallocate arrays and reuse them
- Use operator overloading for one-off calculations

**DON'T:**
- Create new vectors/matrices in every frame
- Use functional style in performance-critical code
- Rely on garbage collection for temporary objects

### 2. FFI Optimization

**DO:**
- Batch GPU operations when possible
- Reuse command encoders
- Cache compiled shaders and pipelines
- Use TypedArrays for data transfer

**DON'T:**
- Make many small FFI calls
- Convert data formats repeatedly
- Create GPU resources in render loop

### 3. Memory Management

```moonbit
// Object pooling pattern
pub struct Vec3Pool {
  mut pool: Array[Vec3]
  mut available: Int
}

impl Vec3Pool {
  pub fn acquire(self: Vec3Pool) -> Vec3 {
    if self.available > 0 {
      self.available -= 1
      self.pool[self.available]
    } else {
      Vec3::zero()
    }
  }
  
  pub fn release(self: Vec3Pool, vec: Vec3) -> Unit {
    vec.set(0.0, 0.0, 0.0)  // Reset
    self.pool[self.available] = vec
    self.available += 1
  }
}
```

### 4. Profiling Strategy

```moonbit
// Performance timing utilities
extern "js" fn performance_now() -> Float =
  #| () => performance.now()

pub fn measure_time[T](name: String, f: () -> T) -> T {
  let start = performance_now()
  let result = f()
  let elapsed = performance_now() - start
  console_log("\{name} took \{elapsed}ms")
  result
}

// Usage
measure_time("render", fn() {
  painter.render_layer(layer)
})
```

## Development Workflow

### Project Setup

```json
// moon.mod.json
{
  "name": "trivalibs-moonbit",
  "version": "0.1.0",
  "deps": {},
  "targets": {
    "js": {
      "main": "src/main",
      "output": "dist/trivalibs.js"
    }
  }
}
```

### Vite Integration

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'moonbit',
      transform(code, id) {
        if (id.endsWith('.mbt')) {
          // Compile MoonBit to JS
          return compileMoonBit(code)
        }
      }
    }
  ],
  server: {
    watch: {
      include: ['**/*.mbt']
    }
  }
})
```

### Development Commands

```bash
# Build the project
moon build --target js

# Run tests
moon test

# Start dev server with hot reload
npm run dev

# Build for production
npm run build
```

## Migration Strategy

### 1. Start with Math Library
- Port gl-matrix test suite
- Benchmark against original
- Optimize based on profiling

### 2. Validate with Simple Examples
- Triangle rendering
- Basic transformations
- Texture loading

### 3. Incremental Feature Addition
- Add features as needed
- Profile each addition
- Maintain performance baseline

### 4. Community Feedback
- Release early versions
- Gather performance data
- Iterate on API design

## Conclusion

Porting trivalibs to MoonBit offers several advantages:

1. **Performance**: Optimized JavaScript generation with no WASM overhead
2. **Developer Experience**: Fast compilation and hot reloading
3. **Type Safety**: Catch errors at compile time
4. **Gradual Migration**: Can move performance-critical parts to WASM later
5. **Small Bundle Size**: ~80KB vs 3MB+ for Rust/WASM

The key to success is maintaining a performance-first mindset while leveraging MoonBit's modern language features for an ergonomic API.

## MoonBit Language Learnings and Best Practices

Based on the actual implementation experience, here are important findings about MoonBit syntax and standard library:

### 1. Type System and Syntax

**Method Definition Syntax:**
```moonbit
// Correct: Methods are defined with explicit self parameter
pub fn length(self : Vec2) -> Double {
  (self.x * self.x + self.y * self.y).sqrt()
}

// For associated functions (constructors), use Type::name syntax
pub fn Vec2::new(x : Double, y : Double) -> Vec2 {
  { x, y }
}
```

**Struct Initialization:**
```moonbit
// MoonBit uses braces without field names when order matches
{ x, y }  // Equivalent to { x: x, y: y }
```

**Mutable Fields:**
```moonbit
pub struct Vec2 {
  mut x : Double  // 'mut' keyword for mutable fields
  mut y : Double
}
```

### 2. Standard Library Differences

**Math Functions:**
```moonbit
// MoonBit uses method syntax for math operations
x.sqrt()     // NOT @math.sqrt(x)
x.sin()      // NOT @math.sin(x)
x.cos()      // NOT @math.cos(x)
x.abs()      // NOT @math.abs(x)
x.floor()    // NOT @math.floor(x)
x.ceil()     // NOT @math.ceil(x)
x.tan()      // NOT @math.tan(x)

// Note: Some functions are deprecated and suggest @math.* alternatives
// but the method syntax works and is cleaner
```

**No Built-in min/max:**
```moonbit
// Must implement your own
pub fn clamp_scalar(x : Double, min_val : Double, max_val : Double) -> Double {
  if x < min_val { min_val } else if x > max_val { max_val } else { x }
}
```

### 3. Testing Framework

**Test Assertions:**
```moonbit
// Old deprecated syntax (avoid):
@test.eq!(a, b)
@test.is_true!(condition)
@test.fail!("message")

// New correct syntax:
assert_eq(a, b)
assert_true(condition)
panic("message")

// Note: No parentheses needed after assert macros
```

**Test Declaration:**
```moonbit
test "test name" {
  // test body
}
```

### 4. Arrays and Loops

**FixedArray:**
```moonbit
// MoonBit uses FixedArray for fixed-size arrays
pub struct Mat4 {
  mut data : FixedArray[Double]  // Size specified at creation
}

// Creation
let arr = FixedArray::make(16, 0.0)  // size, initial value
```

**No Traditional For Loops:**
```moonbit
// Cannot do: for i in 0..9 { }
// Must unroll loops manually:
m.data[0] = other.data[0]
m.data[1] = other.data[1]
// ... etc
```

### 5. Constants and Variables

**Constants:**
```moonbit
// Use lowercase 'let' for module-level constants
let pi : Double = 3.14159265358979323846

// NOT: pub let PI : Double = ...  // This causes errors
```

### 6. Operator Overloading Limitations

**Binary Operators Must Have Same Types:**
```moonbit
// Valid:
pub fn op_add(self : Vec2, other : Vec2) -> Vec2

// Invalid - causes error:
pub fn op_mul(self : Vec2, scalar : Double) -> Vec2

// Workaround: Use methods instead
pub fn mul(self : Vec2, scalar : Double) -> Vec2
```

### 7. Module System

**Package Structure:**
```
src/math/
├── moon.pkg.json  // Empty {} for basic packages
├── vec2.mbt
├── vec3.mbt
├── mat3.mbt
└── mat4.mbt
```

**Name Conflicts:**
- Functions at module level share namespace
- Methods with same name on different types cause conflicts
- Solution: Use type-specific method names or proper module organization

### 8. Optional Types

```moonbit
// MoonBit uses Option-like syntax with ?
pub fn inverse(self : Mat3) -> Mat3? {
  if determinant == 0 {
    None
  } else {
    Some(result)
  }
}

// Pattern matching
match m.inverse() {
  Some(inv) => { /* use inv */ }
  None => panic("Not invertible")
}
```

### 9. String Interpolation

```moonbit
// Use \{} for interpolation in strings
"Value: \{x}"
```

### 10. Method Chaining

```moonbit
// Methods that modify self should return self for chaining
pub fn add_mut(self : Vec3, other : Vec3) -> Vec3 {
  self.x = self.x + other.x
  self.y = self.y + other.y
  self.z = self.z + other.z
  self  // Return self for chaining
}

// Usage:
pos.add_mut(velocity).scale(dt)
```

## Common Pitfalls to Avoid

1. **Don't use uppercase for constants** - causes parse errors
2. **Don't use @math.* package** - use method syntax on Double
3. **Don't use old test assertion syntax** - use built-in assert_*
4. **Don't try to use for loops** - unroll manually
5. **Don't overload operators with different types** - use methods
6. **Be careful with function name conflicts** - MoonBit doesn't namespace well

## Next Steps

1. ✅ Set up MoonBit development environment
2. ✅ Implement core math library with tests
3. Create minimal WebGPU FFI bindings
4. Port simple triangle example
5. Profile and optimize
6. Expand to full feature set

This migration guide provides a solid foundation for bringing trivalibs' elegant graphics API to the web platform with optimal performance.