/**
 * Effect system - post-processing effects that can be applied to layers
 */

import type { Painter } from '../core/painter.js';
import type { Shader } from '../resources/shader.js';
import type { BindingBuffer } from '../resources/binding.js';
import type { ValueBinding } from '../resources/binding.js';

export class Effect {
    constructor(
        public readonly id: number,
        public readonly shader: Shader,
        public readonly bindGroups: GPUBindGroup[],
        public readonly pipeline: GPURenderPipeline
    ) {}
}

export class EffectBuilder {
    private bindings: Map<number, BindingBuffer<any> | ValueBinding> = new Map();
    
    constructor(
        private painter: Painter,
        private shaderId: number
    ) {}
    
    withBindings(bindings: Record<number, BindingBuffer<any> | ValueBinding>): this {
        for (const [slot, binding] of Object.entries(bindings)) {
            this.bindings.set(Number(slot), binding);
        }
        return this;
    }
    
    create(): Effect {
        const shader = this.painter.shaders[this.shaderId];
        
        if (!shader) {
            throw new Error('Invalid shader ID');
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
                label: 'Effect Bind Group',
                layout: this.painter.getBindGroupLayout(shader.bindGroupLayoutIds[0]),
                entries,
            });
            
            bindGroups.push(bindGroup);
        }
        
        // Create pipeline for fullscreen quad
        const pipelineLayout = this.painter.device.createPipelineLayout({
            label: 'Effect Pipeline Layout',
            bindGroupLayouts: shader.bindGroupLayoutIds.map(id => 
                this.painter.getBindGroupLayout(id)
            ),
        });
        
        const pipeline = this.painter.device.createRenderPipeline({
            label: 'Effect Pipeline',
            layout: pipelineLayout,
            vertex: {
                module: this.painter.getShaderModule(shader.vertexModuleId),
                entryPoint: 'main',
            },
            fragment: {
                module: this.painter.getShaderModule(shader.fragmentModuleId),
                entryPoint: 'main',
                targets: [{
                    format: this.painter.format,
                }],
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32',
            },
        });
        
        const effect = new Effect(
            this.painter.effects?.length || 0,
            shader,
            bindGroups,
            pipeline
        );
        
        // Register with painter
        if (!this.painter.effects) {
            this.painter.effects = [];
        }
        this.painter.effects.push(effect);
        
        return effect;
    }
}