/**
 * Layer system - manages render targets and passes
 */

import type { Painter } from '../core/painter.js';
import type { Shape } from './shape.js';
import type { ValueBinding } from '../resources/binding.js';
import type { Effect } from './effect.js';

export interface LayerProps {
    width?: number;
    height?: number;
    useWindowSize?: boolean;
    clearColor?: GPUColor;
    depthTest?: boolean;
    multisampling?: boolean;
    format?: GPUTextureFormat;
    staticTextureData?: Uint8Array | null;
}

export class Layer {
    public id: number;
    private targetTextures: GPUTexture[] = [];
    private currentTarget = 0;
    private textureCount = 1;
    private depthTexture?: GPUTexture;
    private multisampleTexture?: GPUTexture;
    private shapes: Shape[] = [];
    public effects: Effect[] = [];
    
    constructor(
        private painter: Painter,
        public props: Required<LayerProps>
    ) {
        this.id = -1; // Will be set when added to painter
        this.determineTextureCount();
        this.createTextures();
    }
    
    private determineTextureCount(): void {
        // Determine if we need swap targets for effects
        const hasShapes = this.shapes.length > 0 || this.props.staticTextureData !== null;
        const hasEffects = this.effects.length > 0;
        
        // We need swap targets if we have effects and either shapes or multiple effects
        if (hasEffects && (hasShapes || this.effects.length > 1)) {
            this.textureCount = 2;
        } else {
            this.textureCount = 1;
        }
    }
    
    binding(): ValueBinding {
        const texture = this.getCurrentSourceTexture();
        if (!texture) {
            throw new Error('Layer does not have a texture for binding');
        }
        return { type: 'texture', textureId: this.painter.textures.indexOf(texture) };
    }
    
    private swapTargets(): void {
        this.currentTarget = (this.currentTarget + 1) % this.textureCount;
    }
    
    private getCurrentTargetTexture(): GPUTexture | undefined {
        return this.targetTextures[this.currentTarget];
    }
    
    private getCurrentSourceTexture(): GPUTexture | undefined {
        let idx = this.currentTarget;
        if (idx === 0) {
            idx = this.textureCount;
        }
        return this.targetTextures[idx - 1];
    }
    
    private createTextures(): void {
        // Clear any existing textures
        for (const texture of this.targetTextures) {
            texture.destroy();
        }
        this.targetTextures = [];
        
        const { width, height } = this.props.useWindowSize 
            ? this.painter.canvasSize 
            : { width: this.props.width, height: this.props.height };
        
        // Create depth texture if needed
        if (this.props.depthTest) {
            this.depthTexture = this.painter.device.createTexture({
                size: { width, height },
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
                sampleCount: this.props.multisampling ? 4 : 1,
            });
        }
        
        // Create multisample texture if needed
        if (this.props.multisampling) {
            this.multisampleTexture = this.painter.device.createTexture({
                size: { width, height },
                format: this.props.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
                sampleCount: 4,
            });
        }
        
        // Create target textures based on textureCount
        if (!this.props.useWindowSize) {
            for (let i = 0; i < this.textureCount; i++) {
                const usage = this.props.staticTextureData && i === 0
                    ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
                    : GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
                    
                const texture = this.painter.device.createTexture({
                    size: { width, height },
                    format: this.props.format,
                    usage,
                });
                
                // Upload static texture data to first texture if provided
                if (this.props.staticTextureData && i === 0) {
                    const data = this.props.staticTextureData;
                    this.painter.queue.writeTexture(
                        { texture },
                        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
                        { bytesPerRow: width * 4 }, // Assumes RGBA8
                        { width, height }
                    );
                }
                
                this.targetTextures.push(texture);
                this.painter.addTexture(texture);
            }
        }
    }
    
    addShape(shape: Shape): void {
        this.shapes.push(shape);
    }
    
    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }
    
    addEffects(effects: Effect[]): void {
        this.effects.push(...effects);
    }
    
    render(encoder: GPUCommandEncoder): void {
        // Handle different rendering scenarios
        if (this.effects.length > 0 && this.shapes.length === 0) {
            // Effects-only layer (like base_effect example)
            this.renderEffectsOnly(encoder);
        } else if (this.shapes.length > 0 && this.effects.length === 0) {
            // Shapes-only layer (like simple triangle)
            this.renderShapesOnly(encoder);
        } else if (this.shapes.length > 0 && this.effects.length > 0) {
            // Shapes with post-processing effects (like blur example)
            this.renderShapesWithEffects(encoder);
        }
    }
    
    private renderEffectsOnly(encoder: GPUCommandEncoder): void {
        for (const effect of this.effects) {
            const renderPassDescriptor: GPURenderPassDescriptor = {
                label: 'Effect Render Pass',
                colorAttachments: [{
                    view: this.painter.getCurrentTexture().createView(),
                    clearValue: this.props.clearColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            };
            
            const pass = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(effect.pipeline);
            
            // Set bind groups
            for (let i = 0; i < effect.bindGroups.length; i++) {
                pass.setBindGroup(i, effect.bindGroups[i]);
            }
            
            // Draw fullscreen quad
            pass.draw(4);
            pass.end();
        }
    }
    
    private renderShapesOnly(encoder: GPUCommandEncoder): void {
        let colorAttachment: GPURenderPassColorAttachment;
        
        if (this.props.useWindowSize) {
            if (this.multisampleTexture) {
                // Multisampling with window size
                colorAttachment = {
                    view: this.multisampleTexture.createView(),
                    resolveTarget: this.painter.getCurrentTexture().createView(),
                    clearValue: this.props.clearColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                };
            } else {
                // No multisampling with window size
                colorAttachment = {
                    view: this.painter.getCurrentTexture().createView(),
                    clearValue: this.props.clearColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                };
            }
        } else {
            // Off-screen rendering
            const targetTexture = this.getCurrentTargetTexture();
            if (!targetTexture) {
                throw new Error('No target texture available for off-screen rendering');
            }
            colorAttachment = {
                view: (this.multisampleTexture || targetTexture).createView(),
                resolveTarget: this.multisampleTexture ? targetTexture.createView() : undefined,
                clearValue: this.props.clearColor,
                loadOp: 'clear',
                storeOp: 'store',
            };
        }
        
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: 'Layer Render Pass',
            colorAttachments: [colorAttachment],
            depthStencilAttachment: this.depthTexture ? {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            } : undefined,
        };
        
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        
        // Draw all shapes
        for (const shape of this.shapes) {
            shape.draw(pass);
        }
        
        pass.end();
    }
    
    private renderShapesWithEffects(encoder: GPUCommandEncoder): void {
        // For window-sized layers with effects, we need temporary textures
        const { width, height } = this.painter.canvasSize;
        
        // Create temporary textures for effects processing
        const tempTextures: GPUTexture[] = [];
        for (let i = 0; i < 2; i++) {
            tempTextures.push(this.painter.device.createTexture({
                size: { width, height },
                format: this.props.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            }));
        }
        
        // Keep textures alive by storing them temporarily
        if (!this.targetTextures.length) {
            this.targetTextures = tempTextures;
        }
        
        let currentSourceIndex = 0;
        
        // First, render shapes to the first temp texture
        const shapeRenderPass = encoder.beginRenderPass({
            label: 'Shape Render Pass',
            colorAttachments: [{
                view: tempTextures[0].createView(),
                clearValue: this.props.clearColor,
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment: this.depthTexture ? {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            } : undefined,
        });
        
        for (const shape of this.shapes) {
            shape.draw(shapeRenderPass);
        }
        shapeRenderPass.end();
        
        // Apply effects in sequence, ping-ponging between textures
        for (let i = 0; i < this.effects.length; i++) {
            const effect = this.effects[i];
            const isLastEffect = i === this.effects.length - 1;
            const targetIndex = 1 - currentSourceIndex;
            const targetView = isLastEffect && this.props.useWindowSize
                ? this.painter.getCurrentTexture().createView()
                : tempTextures[targetIndex].createView();
            
            const effectPass = encoder.beginRenderPass({
                label: `Effect Pass ${i}`,
                colorAttachments: [{
                    view: targetView,
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });
            
            effectPass.setPipeline(effect.pipeline);
            
            // Set bind groups
            for (let j = 0; j < effect.bindGroups.length; j++) {
                effectPass.setBindGroup(j, effect.bindGroups[j]);
            }
            
            // Set the source texture as the last bind group
            const sourceTextureBindGroup = this.painter.device.createBindGroup({
                label: 'Source Texture Bind Group',
                layout: this.painter.getBindGroupLayout(effect.shader.bindGroupLayoutIds[effect.shader.bindGroupLayoutIds.length - 1]),
                entries: [{
                    binding: 0,
                    resource: tempTextures[currentSourceIndex].createView(),
                }],
            });
            effectPass.setBindGroup(effect.bindGroups.length, sourceTextureBindGroup);
            
            // Draw fullscreen quad
            effectPass.draw(4);
            effectPass.end();
            
            currentSourceIndex = targetIndex;
        }
        
        // Schedule cleanup for next frame
        requestAnimationFrame(() => {
            for (const texture of tempTextures) {
                texture.destroy();
            }
            if (this.targetTextures === tempTextures) {
                this.targetTextures = [];
            }
        });
    }
    
    resize(width: number, height: number): void {
        if (!this.props.useWindowSize) {
            return; // Fixed size layer
        }
        
        // Destroy old textures
        for (const texture of this.targetTextures) {
            texture.destroy();
        }
        this.targetTextures = [];
        
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }
        if (this.multisampleTexture) {
            this.multisampleTexture.destroy();
        }
        
        this.props.width = width;
        this.props.height = height;
        
        // Recreate textures with new size
        this.createTextures();
    }
}

export class LayerBuilder {
    private shapes: Shape[] = [];
    private effects: Effect[] = [];
    private props: LayerProps = {};
    
    constructor(private painter: Painter) {}
    
    withSize(width: number, height: number): this {
        this.props.width = width;
        this.props.height = height;
        this.props.useWindowSize = false;
        return this;
    }
    
    withWindowSize(): this {
        this.props.useWindowSize = true;
        return this;
    }
    
    withShape(shape: Shape): this {
        this.shapes.push(shape);
        return this;
    }
    
    withShapes(shapes: Shape[]): this {
        this.shapes.push(...shapes);
        return this;
    }
    
    withClearColor(color: GPUColor): this {
        this.props.clearColor = color;
        return this;
    }
    
    withDepthTest(enabled = true): this {
        this.props.depthTest = enabled;
        return this;
    }
    
    withMultisampling(enabled = true): this {
        this.props.multisampling = enabled;
        return this;
    }
    
    withFormat(format: GPUTextureFormat): this {
        this.props.format = format;
        return this;
    }
    
    withStaticTextureData(data: Uint8Array): this {
        this.props.staticTextureData = data;
        return this;
    }
    
    withEffect(effect: Effect): this {
        this.effects.push(effect);
        return this;
    }
    
    withEffects(effects: Effect[]): this {
        this.effects.push(...effects);
        return this;
    }
    
    create(): Layer {
        // Apply defaults
        const finalProps: Required<LayerProps> = {
            width: this.props.width ?? this.painter.canvasSize.width,
            height: this.props.height ?? this.painter.canvasSize.height,
            useWindowSize: this.props.useWindowSize ?? true,
            clearColor: this.props.clearColor ?? { r: 0, g: 0, b: 0, a: 1 },
            depthTest: this.props.depthTest ?? false,
            multisampling: this.props.multisampling ?? false,
            format: this.props.format ?? this.painter.format,
            staticTextureData: this.props.staticTextureData ?? null,
        };
        
        const layer = new Layer(this.painter, finalProps);
        
        // Add shapes and effects before texture creation
        for (const shape of this.shapes) {
            layer.addShape(shape);
        }
        for (const effect of this.effects) {
            layer.addEffect(effect);
        }
        
        // Now recalculate texture count and recreate textures based on actual shapes/effects
        (layer as any).determineTextureCount();
        (layer as any).createTextures();
        
        // Register with painter
        layer.id = this.painter.layers.length;
        this.painter.layers.push(layer);
        
        return layer;
    }
}