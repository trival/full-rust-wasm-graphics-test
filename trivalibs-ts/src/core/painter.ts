/**
 * Core Painter class - manages WebGPU device and resources
 */

import { Form, FormBuilder } from '../resources/form.js';
import { Shader, ShaderBuilder } from '../resources/shader.js';
import { ShapeBuilder } from '../rendering/shape.js';
import { LayerBuilder } from '../rendering/layer.js';
import { EffectBuilder } from '../rendering/effect.js';
import { BindingBuffer } from '../resources/binding.js';
import type { Mat4, Vec4, Vec3, Mat3, Vec2 } from '../math/index.js';
import { createMat4Aligned, createVec4Aligned, createVec3Aligned } from '../math/index.js';

export interface PainterConfig {
    useVsync?: boolean;
    features?: GPUFeatureName[];
}

export class Painter {
    public device!: GPUDevice;
    public queue!: GPUQueue;
    public format!: GPUTextureFormat;
    
    private context!: GPUCanvasContext;
    private _canvas!: HTMLCanvasElement;
    
    // Resource storage
    public forms: Form[] = [];
    public shaders: Shader[] = [];
    public layers: any[] = []; // Layer type
    public effects: any[] = []; // Effect type
    private buffers: GPUBuffer[] = [];
    public textures: GPUTexture[] = [];
    private samplers: GPUSampler[] = [];
    private shaderModules: GPUShaderModule[] = [];
    private bindGroupLayouts: GPUBindGroupLayout[] = [];
    private pipelines: Map<string, GPURenderPipeline> = new Map();
    
    constructor(private config: PainterConfig = {}) {}
    
    async init(canvas: HTMLCanvasElement): Promise<void> {
        this._canvas = canvas;
        
        // Check WebGPU support
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported in this browser');
        }
        
        // Request adapter
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('Failed to get WebGPU adapter');
        }
        
        // Request device
        const features: GPUFeatureName[] = this.config.features || [];
        this.device = await adapter.requestDevice({
            requiredFeatures: features,
        });
        
        // Set up device lost handling
        this.device.lost.then((info) => {
            console.error('WebGPU device was lost:', info);
        });
        
        this.queue = this.device.queue;
        
        // Configure canvas context
        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        if (!this.context) {
            throw new Error('Failed to get WebGPU context from canvas');
        }
        
        // Get preferred format
        this.format = navigator.gpu.getPreferredCanvasFormat();
        
        // Configure the context
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });
    }
    
    // Builder methods
    form(): FormBuilder {
        return new FormBuilder(this);
    }
    
    shader(): ShaderBuilder {
        return new ShaderBuilder(this);
    }
    
    shaderEffect(): ShaderBuilder {
        // Effect shaders don't need vertex attributes
        return new ShaderBuilder(this).withEffectDefaults();
    }
    
    shape(formId: number, shaderId: number): ShapeBuilder {
        return new ShapeBuilder(this, formId, shaderId);
    }
    
    layer(): LayerBuilder {
        return new LayerBuilder(this);
    }
    
    effect(shaderId: number): EffectBuilder {
        return new EffectBuilder(this, shaderId);
    }
    
    // Binding creation methods
    bindMat4(): BindingBuffer<Mat4> {
        const buffer = this.device.createBuffer({
            size: 64, // 4x4 matrix = 16 floats = 64 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 64, (mat: Mat4) => {
            const data = new Float32Array(16);
            data.set(mat);
            return { data };
        });
    }
    
    bindVec4(): BindingBuffer<Vec4> {
        const buffer = this.device.createBuffer({
            size: 16, // 4 floats = 16 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 16, (vec: Vec4) => {
            const data = new Float32Array(4);
            data.set(vec);
            return { data };
        });
    }
    
    bindVec3(): BindingBuffer<Vec3> {
        const buffer = this.device.createBuffer({
            size: 16, // 3 floats + padding = 16 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 16, (vec: Vec3) => {
            const data = new Float32Array(4);
            data[0] = vec[0];
            data[1] = vec[1];
            data[2] = vec[2];
            data[3] = 0; // padding
            return { data };
        });
    }
    
    bindConstVec4(value: Vec4): BindingBuffer<Vec4> {
        const buffer = this.bindVec4();
        buffer.update(value);
        return buffer;
    }
    
    bindVec2(): BindingBuffer<Vec2> {
        const buffer = this.device.createBuffer({
            size: 16, // 2 floats + padding = 16 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 16, (vec: Vec2) => {
            const data = new Float32Array(4);
            data[0] = vec[0];
            data[1] = vec[1];
            data[2] = 0; // padding
            data[3] = 0; // padding
            return { data };
        });
    }
    
    bindConstVec2(value: Vec2): BindingBuffer<Vec2> {
        const buffer = this.bindVec2();
        buffer.update(value);
        return buffer;
    }
    
    bindF32(): BindingBuffer<number> {
        const buffer = this.device.createBuffer({
            size: 16, // 1 float + padding = 16 bytes (minimum uniform size)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 16, (value: number) => {
            const data = new Float32Array(4);
            data[0] = value;
            return { data };
        });
    }
    
    bindConstF32(value: number): BindingBuffer<number> {
        const buffer = this.bindF32();
        buffer.update(value);
        return buffer;
    }
    
    bindUVec2(): BindingBuffer<Uint32Array> {
        const buffer = this.device.createBuffer({
            size: 16, // 2 uint32 + padding = 16 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 16, (vec: Uint32Array) => {
            const data = new Uint32Array(4);
            data[0] = vec[0];
            data[1] = vec[1];
            return { data };
        });
    }
    
    bindMat3(): BindingBuffer<Mat3> {
        const buffer = this.device.createBuffer({
            size: 48, // 3x3 matrix with padding = 12 floats = 48 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const id = this.addBuffer(buffer);
        return new BindingBuffer(this, id, 48, (mat: Mat3) => {
            // Mat3 needs to be padded to match WGSL std140 layout
            // Each column is padded to 16 bytes (vec3 + padding)
            const data = new Float32Array(12);
            data[0] = mat[0]; data[1] = mat[1]; data[2] = mat[2]; // col 0
            data[4] = mat[3]; data[5] = mat[4]; data[6] = mat[5]; // col 1  
            data[8] = mat[6]; data[9] = mat[7]; data[10] = mat[8]; // col 2
            return { data };
        });
    }
    
    // Sampler creation methods
    samplerLinear(): number {
        const sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });
        return this.addSampler(sampler);
    }
    
    samplerNearest(): number {
        const sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });
        return this.addSampler(sampler);
    }
    
    // Resource management
    addBuffer(buffer: GPUBuffer): number {
        this.buffers.push(buffer);
        return this.buffers.length - 1;
    }
    
    addTexture(texture: GPUTexture): number {
        this.textures.push(texture);
        return this.textures.length - 1;
    }
    
    addShaderModule(module: GPUShaderModule): number {
        this.shaderModules.push(module);
        return this.shaderModules.length - 1;
    }
    
    addBindGroupLayout(layout: GPUBindGroupLayout): number {
        this.bindGroupLayouts.push(layout);
        return this.bindGroupLayouts.length - 1;
    }
    
    getBuffer(id: number): GPUBuffer {
        return this.buffers[id];
    }
    
    getTexture(id: number): GPUTexture {
        return this.textures[id];
    }
    
    getShaderModule(id: number): GPUShaderModule {
        return this.shaderModules[id];
    }
    
    getBindGroupLayout(id: number): GPUBindGroupLayout {
        return this.bindGroupLayouts[id];
    }
    
    addSampler(sampler: GPUSampler): number {
        this.samplers.push(sampler);
        return this.samplers.length - 1;
    }
    
    getSampler(id: number): GPUSampler {
        return this.samplers[id];
    }
    
    // Pipeline caching
    getPipeline(key: string): GPURenderPipeline | undefined {
        return this.pipelines.get(key);
    }
    
    setPipeline(key: string, pipeline: GPURenderPipeline): void {
        this.pipelines.set(key, pipeline);
    }
    
    // Canvas management
    get canvasSize(): { width: number; height: number } {
        return {
            width: this._canvas.width,
            height: this._canvas.height,
        };
    }
    
    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }
    
    resize(width: number, height: number): void {
        this._canvas.width = width;
        this._canvas.height = height;
        
        // Reconfigure context
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });
        
        // Resize all window-sized layers
        for (const layer of this.layers) {
            if (layer.props?.useWindowSize) {
                layer.resize(width, height);
            }
        }
    }
    
    // Rendering
    getCurrentTexture(): GPUTexture {
        return this.context.getCurrentTexture();
    }
    
    requestNextFrame(): void {
        // In a real implementation, this would be part of the app framework
        requestAnimationFrame(() => {});
    }
    
    // Cleanup
    destroy(): void {
        // Destroy all resources
        for (const buffer of this.buffers) {
            buffer.destroy();
        }
        for (const texture of this.textures) {
            texture.destroy();
        }
        
        this.buffers = [];
        this.textures = [];
        this.shaderModules = [];
        this.bindGroupLayouts = [];
        this.pipelines.clear();
    }
}