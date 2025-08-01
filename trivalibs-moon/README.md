# Trivalibs Math Library for MoonBit

A performance-focused math library for MoonBit, providing WGSL-compatible vector and matrix types for WebGPU applications.

## Features

- Vec2, Vec3, Vec4 types with mutable operations for performance
- Mat3, Mat4 types with common transformations
- WGSL-compatible function names and semantics
- Follows gl-matrix performance patterns

## Usage

```moonbit
// Create vectors
let v1 = Vec2::new(1.0, 2.0)
let v2 = Vec2::new(3.0, 4.0)

// Operations
let sum = v1.add(v2)  // Creates new vector
let length = v1.length()
let normalized = v1.normalized()

// Matrices
let m = Mat4::identity()
let translated = m.translate(Vec3::new(10.0, 20.0, 30.0))
```

## Testing

Run tests with:
```bash
moon test
```