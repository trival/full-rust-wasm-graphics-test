// WGSL shaders for the blur example

export const triangleVertexShader = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn main(
    @location(0) pos: vec2<f32>,
    @location(1) uv: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(pos, 0.0, 1.0);
    output.uv = uv;
    return output;
}`;

export const triangleFragmentShader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(uv.x, uv.y, 0.0, 1.0);
}`;

export const blurFragmentShader = `
@group(0) @binding(0) var<uniform> diameter: f32;
@group(0) @binding(1) var<uniform> resolution: vec2<f32>;
@group(0) @binding(2) var<uniform> dir: vec2<f32>;
@group(0) @binding(3) var sampler0: sampler;
@group(1) @binding(0) var tex: texture_2d<f32>;

// 9-tap Gaussian blur with precalculated weights
fn gaussian_blur_9(uv: vec2<f32>, res: vec2<f32>, direction: vec2<f32>) -> vec4<f32> {
    let off1 = 1.3846153846 * direction;
    let off2 = 3.2307692308 * direction;
    
    var color = textureSample(tex, sampler0, uv) * 0.2270270270;
    color += textureSample(tex, sampler0, uv + (off1 / res)) * 0.3162162162;
    color += textureSample(tex, sampler0, uv - (off1 / res)) * 0.3162162162;
    color += textureSample(tex, sampler0, uv + (off2 / res)) * 0.0702702703;
    color += textureSample(tex, sampler0, uv - (off2 / res)) * 0.0702702703;
    return color;
}

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = fragCoord.xy / resolution;
    return gaussian_blur_9(uv, resolution, dir * diameter);
}`;