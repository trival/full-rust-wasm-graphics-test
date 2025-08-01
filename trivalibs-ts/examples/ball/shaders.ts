// WGSL shaders for the ball example

export const vertexShader = `
@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;
@group(0) @binding(1) var<uniform> normalMatrix: mat3x3<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) normal: vec3<f32>,
    @location(3) color: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = mvp * vec4<f32>(input.position, 1.0);
    output.uv = input.uv;
    output.normal = normalize(normalMatrix * input.normal);
    output.color = input.color;
    return output;
}
`;

export const fragmentShader = `
@group(0) @binding(2) var textureSampler: sampler;
@group(1) @binding(0) var textureData: texture_2d<f32>;

struct FragmentInput {
    @location(0) uv: vec2<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec3<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // Sample texture
    let texColor = textureSample(textureData, textureSampler, input.uv);
    
    // Simple directional lighting
    let lightDir = normalize(vec3<f32>(0.5, 0.7, 0.3));
    let diffuse = max(dot(input.normal, lightDir), 0.0) * 0.8 + 0.2;
    
    // Combine texture, vertex color, and lighting
    let finalColor = texColor.rgb * input.color * diffuse;
    
    return vec4<f32>(finalColor, 1.0);
}
`;