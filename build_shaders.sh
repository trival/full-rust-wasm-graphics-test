#!/bin/bash
cd src/shader
cargo gpu build --shader-crate --target spirv-unknown-vulkan1.1
cp target/spirv-unknown-vulkan1.1/release/deps/*.spv ../../src/shader/