// WGSL shaders for the simple triangle example

export const vertexShader = `
@group(0) @binding(0) var<uniform> vp_mat: mat4x4<f32>;
@group(0) @binding(1) var<uniform> model_mat: mat4x4<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let world_pos = model_mat * vec4<f32>(input.position, 1.0);
    output.position = vp_mat * world_pos;
    return output;
}
`;

export const fragmentShader = `
struct Color {
    color: vec4<f32>,
}

@group(0) @binding(2) var<uniform> color_uniform: Color;

@fragment
fn main() -> @location(0) vec4<f32> {
    return color_uniform.color;
}
`;