/**
 * Math utilities for trivalibs-ts
 * Re-exports gl-matrix with convenience functions matching Rust trivalibs API
 */

import { vec2, vec3, vec4, mat3, mat4, quat } from 'gl-matrix';

// Re-export gl-matrix types
export { vec2, vec3, vec4, mat3, mat4, quat };

// Type aliases for better API compatibility
export type Vec2 = vec2;
export type Vec3 = vec3;
export type Vec4 = vec4;
export type Mat3 = mat3;
export type Mat4 = mat4;
export type Quat = quat;

// Convenience functions matching Rust API
export function vec2Create(x: number, y: number): Vec2 {
    return vec2.fromValues(x, y);
}

export function vec3Create(x: number, y: number, z: number): Vec3 {
    return vec3.fromValues(x, y, z);
}

export function vec4Create(x: number, y: number, z: number, w: number): Vec4 {
    return vec4.fromValues(x, y, z, w);
}

// Aligned types for uniform buffers (WebGPU requires specific alignment)
export interface Vec3Aligned {
    readonly data: Float32Array; // 16 bytes (vec3 + padding)
}

export interface Vec4Aligned {
    readonly data: Float32Array; // 16 bytes
}

export interface Mat3Aligned {
    readonly data: Float32Array; // 48 bytes (3x vec3 with padding)
}

export interface Mat4Aligned {
    readonly data: Float32Array; // 64 bytes
}

// Create aligned versions for GPU buffers
export function createVec3Aligned(x: number, y: number, z: number): Vec3Aligned {
    const data = new Float32Array(4); // 16 bytes
    data[0] = x;
    data[1] = y;
    data[2] = z;
    data[3] = 0; // padding
    return { data };
}

export function createVec4Aligned(x: number, y: number, z: number, w: number): Vec4Aligned {
    const data = new Float32Array(4);
    data[0] = x;
    data[1] = y;
    data[2] = z;
    data[3] = w;
    return { data };
}

export function createMat4Aligned(matrix: Mat4): Mat4Aligned {
    const data = new Float32Array(16);
    data.set(matrix);
    return { data };
}

export function createMat3Aligned(matrix: Mat3): Mat3Aligned {
    const data = new Float32Array(12); // 3x4 for alignment
    // Copy with padding for each row
    data[0] = matrix[0]; data[1] = matrix[1]; data[2] = matrix[2]; data[3] = 0;
    data[4] = matrix[3]; data[5] = matrix[4]; data[6] = matrix[5]; data[7] = 0;
    data[8] = matrix[6]; data[9] = matrix[7]; data[10] = matrix[8]; data[11] = 0;
    return { data };
}

// Utility functions
export function degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

// Export camera and transform modules
export { Transform } from './transform.js';
export { PerspectiveCamera, type CameraProps } from './camera.js';

// Convenience functions for unsigned vectors
export function uvec2(x: number, y: number): Uint32Array {
    return new Uint32Array([x, y]);
}