#![no_std]
#![allow(unexpected_cfgs)]

#[cfg(target_arch = "spirv")]
use spirv_std::glam::{vec3, vec4, Vec3, Vec4};
use spirv_std::spirv;
#[cfg(not(target_arch = "spirv"))]
use trivalibs::glam::{vec3, vec4, Vec3, Vec4};

#[spirv(vertex)]
pub fn vertex(
    position: Vec3,
    #[spirv(position)] clip_pos: &mut Vec4,
) {
    *clip_pos = position.extend(1.0);
}

#[spirv(fragment)]
pub fn fragment(
    frag_color: &mut Vec4,
) {
    // Simple red color for now
    *frag_color = vec4(1.0, 0.0, 0.0, 1.0);
}