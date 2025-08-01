/**
 * Trivalibs-ts - TypeScript port of trivalibs painter
 * Targeting native WebGPU for better performance
 */

// Core
export { Painter, type PainterConfig } from "./core/painter.js";

// Resources
export {
	BINDING_BUFFER_BOTH,
	BINDING_BUFFER_FRAG,
	BINDING_BUFFER_VERT,
	BINDING_SAMPLER_FRAG,
	BINDING_TEXTURE_FRAG,
	BindingBuffer,
	type BindingLayout,
	type ValueBinding,
} from "./resources/binding.js";
export { Form, FormBuilder, type FormProps } from "./resources/form.js";
export {
	Shader,
	ShaderBuilder,
	type VertexAttribute,
} from "./resources/shader.js";

// Rendering
export { Layer, LayerBuilder, type LayerProps } from "./rendering/layer.js";
export { Shape, ShapeBuilder, type ShapeProps } from "./rendering/shape.js";
export { Effect, EffectBuilder } from "./rendering/effect.js";

// Math
export * from "./math/index.js";

// App framework
export {
	AppRunner,
	type AppConfig,
	type CanvasApp,
	type Event,
} from "./app/index.js";

// Note: WebGPU types are globally available when using @webgpu/types
// They don't need to be explicitly imported or re-exported
