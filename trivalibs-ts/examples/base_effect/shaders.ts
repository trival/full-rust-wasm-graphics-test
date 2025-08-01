// WGSL shaders for the base effect example

export const fragmentShader = `
@group(0) @binding(0) var<uniform> u_size: vec2<u32>;
@group(0) @binding(1) var<uniform> u_time: f32;

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let resolution = vec2<f32>(f32(u_size.x), f32(u_size.y));
    let uv = fragCoord.xy / resolution;
    
    // Create animated gradient pattern
    let time = u_time;
    let r = 0.5 + 0.5 * sin(time + uv.x * 10.0);
    let g = 0.5 + 0.5 * sin(time + uv.y * 10.0 + 2.0);
    let b = 0.5 + 0.5 * sin(time + length(uv - 0.5) * 10.0 + 4.0);
    
    return vec4<f32>(r, g, b, 1.0);
}
`;