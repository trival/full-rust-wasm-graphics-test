/**
 * Shape system - combines form, shader, and bindings
 */

import type { Painter } from '../core/painter.js';
import type { Form } from '../resources/form.js';
import type { Shader } from '../resources/shader.js';
import type { BindingBuffer } from '../resources/binding.js';
import type { ValueBinding } from '../resources/binding.js';

export interface ShapeProps {
    cullMode?: GPUCullMode;
    depthWriteEnabled?: boolean;
    depthCompare?: GPUCompareFunction;
}

export class Shape {
    constructor(
        public readonly painter: Painter,
        public readonly form: Form,
        public readonly shader: Shader,
        public readonly bindGroups: GPUBindGroup[],
        public readonly pipeline: GPURenderPipeline,
        public readonly props: Required<ShapeProps>
    ) {}
    
    draw(passEncoder: GPURenderPassEncoder): void {
        passEncoder.setPipeline(this.pipeline);
        
        // Set vertex buffer
        const vertexBuffer = this.painter.getBuffer(this.form.vertexBufferId);
        passEncoder.setVertexBuffer(0, vertexBuffer);
        
        // Set index buffer if present
        if (this.form.indexBufferId !== null) {
            const indexBuffer = this.painter.getBuffer(this.form.indexBufferId);
            passEncoder.setIndexBuffer(indexBuffer, 'uint32');
        }
        
        // Set bind groups
        for (let i = 0; i < this.bindGroups.length; i++) {
            passEncoder.setBindGroup(i, this.bindGroups[i]);
        }
        
        // Draw
        if (this.form.indexBufferId !== null) {
            passEncoder.drawIndexed(this.form.indexCount);
        } else {
            passEncoder.draw(this.form.vertexCount);
        }
    }
}

export class ShapeBuilder {
    private bindings: Map<number, BindingBuffer<any> | ValueBinding> = new Map();
    private layerBindings: Map<number, ValueBinding> = new Map();
    private props: ShapeProps = {};
    
    constructor(
        private painter: Painter,
        private formId: number,
        private shaderId: number
    ) {}
    
    withBindings(bindings: Record<number, BindingBuffer<any> | ValueBinding>): this {
        for (const [slot, binding] of Object.entries(bindings)) {
            this.bindings.set(Number(slot), binding);
        }
        return this;
    }
    
    withLayers(layers: Record<number, ValueBinding>): this {
        for (const [slot, binding] of Object.entries(layers)) {
            this.layerBindings.set(Number(slot), binding);
        }
        return this;
    }
    
    withCullMode(cullMode: GPUCullMode | null): this {
        this.props.cullMode = cullMode ?? 'none';
        return this;
    }
    
    withDepthWrite(enabled: boolean): this {
        this.props.depthWriteEnabled = enabled;
        return this;
    }
    
    withDepthCompare(compare: GPUCompareFunction): this {
        this.props.depthCompare = compare;
        return this;
    }
    
    create(targetFormat?: GPUTextureFormat): Shape {
        // Get form and shader
        const form = this.painter.forms[this.formId];
        const shader = this.painter.shaders[this.shaderId];
        
        if (!form || !shader) {
            throw new Error('Invalid form or shader ID');
        }
        
        // Create bind groups
        const bindGroups: GPUBindGroup[] = [];
        
        if (shader.bindGroupLayoutIds.length > 0) {
            const entries: GPUBindGroupEntry[] = [];
            
            for (const [slot, binding] of this.bindings) {
                let resource: GPUBindingResource;
                
                if ('getBuffer' in binding) {
                    // It's a BindingBuffer
                    resource = { buffer: binding.getBuffer() };
                } else {
                    // It's a ValueBinding
                    switch (binding.type) {
                        case 'buffer':
                            resource = { buffer: this.painter.getBuffer(binding.bufferId) };
                            break;
                        case 'sampler':
                            resource = this.painter.getSampler(binding.samplerId);
                            break;
                        case 'texture':
                            resource = this.painter.getTexture(binding.textureId).createView();
                            break;
                        default:
                            throw new Error(`Unsupported binding type: ${binding.type}`);
                    }
                }
                
                entries.push({
                    binding: slot,
                    resource,
                });
            }
            
            const bindGroup = this.painter.device.createBindGroup({
                label: 'Shape Bind Group',
                layout: this.painter.getBindGroupLayout(shader.bindGroupLayoutIds[0]),
                entries,
            });
            
            bindGroups.push(bindGroup);
        }
        
        // Create second bind group for layers
        if (shader.bindGroupLayoutIds.length > 1 && this.layerBindings.size > 0) {
            const entries: GPUBindGroupEntry[] = [];
            
            for (const [slot, binding] of this.layerBindings) {
                let resource: GPUBindingResource;
                
                switch (binding.type) {
                    case 'buffer':
                        resource = { buffer: this.painter.getBuffer(binding.bufferId) };
                        break;
                    case 'sampler':
                        resource = this.painter.getSampler(binding.samplerId);
                        break;
                    case 'texture':
                        resource = this.painter.getTexture(binding.textureId).createView();
                        break;
                    default:
                        throw new Error(`Unsupported layer binding type: ${binding.type}`);
                }
                
                entries.push({
                    binding: slot,
                    resource,
                });
            }
            
            const bindGroup = this.painter.device.createBindGroup({
                label: 'Shape Layers Bind Group',
                layout: this.painter.getBindGroupLayout(shader.bindGroupLayoutIds[1]),
                entries,
            });
            
            bindGroups.push(bindGroup);
        }
        
        // Apply defaults
        const finalProps: Required<ShapeProps> = {
            cullMode: this.props.cullMode ?? 'none',
            depthWriteEnabled: this.props.depthWriteEnabled ?? false,
            depthCompare: this.props.depthCompare ?? 'less',
        };
        
        // Use painter's format if not specified
        const format = targetFormat ?? this.painter.format;
        
        // Create pipeline
        const pipelineKey = `${this.formId}-${this.shaderId}-${JSON.stringify(finalProps)}-${format}`;
        let pipeline = this.painter.getPipeline(pipelineKey);
        
        if (!pipeline) {
            const pipelineLayout = this.painter.device.createPipelineLayout({
                label: 'Shape Pipeline Layout',
                bindGroupLayouts: shader.bindGroupLayoutIds.map(id => 
                    this.painter.getBindGroupLayout(id)
                ),
            });
            
            pipeline = this.painter.device.createRenderPipeline({
                label: 'Shape Pipeline',
                layout: pipelineLayout,
                vertex: {
                    module: this.painter.getShaderModule(shader.vertexModuleId),
                    entryPoint: 'main',
                    buffers: [shader.vertexBufferLayout],
                },
                fragment: {
                    module: this.painter.getShaderModule(shader.fragmentModuleId),
                    entryPoint: 'main',
                    targets: [{
                        format: format,
                    }],
                },
                primitive: {
                    topology: form.props.topology,
                    cullMode: finalProps.cullMode,
                    frontFace: form.props.frontFace,
                },
                depthStencil: finalProps.depthWriteEnabled ? {
                    format: 'depth24plus',
                    depthWriteEnabled: finalProps.depthWriteEnabled,
                    depthCompare: finalProps.depthCompare,
                } : undefined,
            });
            
            this.painter.setPipeline(pipelineKey, pipeline);
        }
        
        return new Shape(
            this.painter,
            form,
            shader,
            bindGroups,
            pipeline,
            finalProps
        );
    }
}