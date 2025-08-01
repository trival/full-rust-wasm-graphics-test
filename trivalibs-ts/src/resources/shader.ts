/**
 * Shader system - manages shader modules and pipeline layouts
 */

import type { Painter } from '../core/painter.js';
import type { BindingLayout } from './binding.js';
import { BINDING_TEXTURE_FRAG } from './binding.js';

export interface VertexAttribute {
    format: GPUVertexFormat;
    offset: number;
    shaderLocation: number;
}

export class Shader {
    constructor(
        public readonly id: number,
        public readonly vertexModuleId: number,
        public readonly fragmentModuleId: number,
        public readonly bindGroupLayoutIds: number[],
        public readonly vertexAttributes: VertexAttribute[],
        public readonly vertexBufferLayout: GPUVertexBufferLayout
    ) {}
}

export class ShaderBuilder {
    private vertexSource?: string;
    private fragmentSource?: string;
    private vertexAttributes: GPUVertexFormat[] = [];
    private bindings: BindingLayout[] = [];
    private layers: BindingLayout[] = [];
    
    constructor(private painter: Painter) {}
    
    withVertexAttributes(attributes: VertexAttribute[] | GPUVertexFormat[]): this {
        // If it's an array of strings (GPUVertexFormat), convert to VertexAttribute
        if (typeof attributes[0] === 'string') {
            this.vertexAttributes = attributes as GPUVertexFormat[];
        } else {
            // Convert VertexAttribute[] to GPUVertexFormat[]
            this.vertexAttributes = (attributes as VertexAttribute[]).map(attr => attr.format);
        }
        return this;
    }
    
    withBindings(bindings: BindingLayout[]): this {
        this.bindings = bindings;
        return this;
    }
    
    withLayers(layers: BindingLayout[]): this {
        this.layers = layers;
        return this;
    }
    
    withLayer(): this {
        // Single texture layer for effects
        this.layers = [BINDING_TEXTURE_FRAG];
        return this;
    }
    
    withEffectDefaults(): this {
        // Default vertex shader for fullscreen effects
        this.vertexSource = `
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>( 1.0,  1.0)
    );
    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}`;
        return this;
    }
    
    withVertexSource(wgsl: string): this {
        this.vertexSource = wgsl;
        return this;
    }
    
    withFragmentSource(wgsl: string): this {
        this.fragmentSource = wgsl;
        return this;
    }
    
    withVertexShader(wgsl: string): this {
        return this.withVertexSource(wgsl);
    }
    
    withFragmentShader(wgsl: string): this {
        return this.withFragmentSource(wgsl);
    }
    
    async loadVertexShader(url: string): Promise<this> {
        const response = await fetch(url);
        this.vertexSource = await response.text();
        return this;
    }
    
    async loadFragmentShader(url: string): Promise<this> {
        const response = await fetch(url);
        this.fragmentSource = await response.text();
        return this;
    }
    
    create(): Shader {
        if (!this.vertexSource || !this.fragmentSource) {
            throw new Error('Both vertex and fragment shaders must be provided');
        }
        
        // Create shader modules
        const vertexModule = this.painter.device.createShaderModule({
            label: 'Vertex Shader',
            code: this.vertexSource,
        });
        
        const fragmentModule = this.painter.device.createShaderModule({
            label: 'Fragment Shader',
            code: this.fragmentSource,
        });
        
        const vertexModuleId = this.painter.addShaderModule(vertexModule);
        const fragmentModuleId = this.painter.addShaderModule(fragmentModule);
        
        // Create bind group layouts
        const bindGroupLayoutIds: number[] = [];
        
        if (this.bindings.length > 0) {
            const entries: GPUBindGroupLayoutEntry[] = this.bindings.map((binding, index) => {
                const entry: GPUBindGroupLayoutEntry = {
                    binding: index,
                    visibility: binding.visibility,
                };
                
                switch (binding.bindingType) {
                    case 'uniform':
                        entry.buffer = { type: 'uniform' };
                        break;
                    case 'storage':
                        entry.buffer = { type: 'storage' };
                        break;
                    case 'sampler':
                        entry.sampler = { type: 'filtering' };
                        break;
                    case 'texture':
                        entry.texture = { sampleType: 'float' };
                        break;
                }
                
                return entry;
            });
            
            const layout = this.painter.device.createBindGroupLayout({
                label: 'Shader Bind Group Layout',
                entries,
            });
            
            bindGroupLayoutIds.push(this.painter.addBindGroupLayout(layout));
        }
        
        // Create second bind group layout for layers
        if (this.layers.length > 0) {
            const entries: GPUBindGroupLayoutEntry[] = this.layers.map((binding, index) => {
                const entry: GPUBindGroupLayoutEntry = {
                    binding: index,
                    visibility: binding.visibility,
                };
                
                switch (binding.bindingType) {
                    case 'uniform':
                        entry.buffer = { type: 'uniform' };
                        break;
                    case 'storage':
                        entry.buffer = { type: 'storage' };
                        break;
                    case 'sampler':
                        entry.sampler = { type: 'filtering' };
                        break;
                    case 'texture':
                        entry.texture = { sampleType: 'float' };
                        break;
                }
                
                return entry;
            });
            
            const layout = this.painter.device.createBindGroupLayout({
                label: 'Shader Layers Bind Group Layout',
                entries,
            });
            
            bindGroupLayoutIds.push(this.painter.addBindGroupLayout(layout));
        }
        
        // Create vertex attributes and buffer layout
        const attributes: VertexAttribute[] = [];
        let offset = 0;
        
        for (let i = 0; i < this.vertexAttributes.length; i++) {
            const format = this.vertexAttributes[i];
            attributes.push({
                format,
                offset,
                shaderLocation: i,
            });
            offset += getVertexFormatSize(format);
        }
        
        const vertexBufferLayout: GPUVertexBufferLayout = {
            arrayStride: offset,
            stepMode: 'vertex',
            attributes: attributes.map(attr => ({
                format: attr.format,
                offset: attr.offset,
                shaderLocation: attr.shaderLocation,
            })),
        };
        
        const shader = new Shader(
            this.painter.shaders.length, // id
            vertexModuleId,
            fragmentModuleId,
            bindGroupLayoutIds,
            attributes,
            vertexBufferLayout
        );
        
        this.painter.shaders.push(shader);
        return shader;
    }
}

function getVertexFormatSize(format: GPUVertexFormat): number {
    const sizes: Partial<Record<GPUVertexFormat, number>> = {
        'uint8x2': 2,
        'uint8x4': 4,
        'sint8x2': 2,
        'sint8x4': 4,
        'unorm8x2': 2,
        'unorm8x4': 4,
        'snorm8x2': 2,
        'snorm8x4': 4,
        'uint16x2': 4,
        'uint16x4': 8,
        'sint16x2': 4,
        'sint16x4': 8,
        'unorm16x2': 4,
        'unorm16x4': 8,
        'snorm16x2': 4,
        'snorm16x4': 8,
        'float16x2': 4,
        'float16x4': 8,
        'float32': 4,
        'float32x2': 8,
        'float32x3': 12,
        'float32x4': 16,
        'uint32': 4,
        'uint32x2': 8,
        'uint32x3': 12,
        'uint32x4': 16,
        'sint32': 4,
        'sint32x2': 8,
        'sint32x3': 12,
        'sint32x4': 16,
        // Add any missing formats
        'uint8': 1,
        'sint8': 1,
        'unorm8': 1,
        'snorm8': 1,
        'uint16': 2,
        'sint16': 2,
        'unorm16': 2,
        'snorm16': 2,
        'float16': 2,
    };
    
    return sizes[format] || 0;
}