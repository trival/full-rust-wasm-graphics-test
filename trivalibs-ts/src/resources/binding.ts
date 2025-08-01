/**
 * Binding system for uniform buffers and textures
 */

import type { Painter } from '../core/painter.js';

export interface AlignedData {
    readonly data: ArrayBuffer | ArrayBufferView;
}

export class BindingBuffer<T> {
    constructor(
        private painter: Painter,
        private bufferId: number,
        private size: number,
        private alignmentFn: (value: T) => AlignedData
    ) {}
    
    update(value: T): void {
        const aligned = this.alignmentFn(value);
        const buffer = this.painter.getBuffer(this.bufferId);
        const data = aligned.data;
        if (data instanceof ArrayBuffer) {
            this.painter.queue.writeBuffer(buffer, 0, data);
        } else {
            this.painter.queue.writeBuffer(buffer, 0, data.buffer, data.byteOffset, data.byteLength);
        }
    }
    
    getBuffer(): GPUBuffer {
        return this.painter.getBuffer(this.bufferId);
    }
    
    getBufferId(): number {
        return this.bufferId;
    }
}

export type ValueBinding = 
    | { type: 'buffer'; bufferId: number }
    | { type: 'sampler'; samplerId: number }
    | { type: 'texture'; textureId: number }
    | { type: 'texture-view'; textureViewId: number };

export interface BindingLayout {
    bindingType: 'uniform' | 'storage' | 'sampler' | 'texture';
    visibility: number; // GPUShaderStageFlags
}

// WebGPU shader stage constants
const VERTEX = 0x1;
const FRAGMENT = 0x2;

export const BINDING_BUFFER_VERT: BindingLayout = {
    bindingType: 'uniform',
    visibility: VERTEX,
};

export const BINDING_BUFFER_FRAG: BindingLayout = {
    bindingType: 'uniform',
    visibility: FRAGMENT,
};

export const BINDING_BUFFER_BOTH: BindingLayout = {
    bindingType: 'uniform',
    visibility: VERTEX | FRAGMENT,
};

export const BINDING_SAMPLER_FRAG: BindingLayout = {
    bindingType: 'sampler',
    visibility: FRAGMENT,
};

export const BINDING_TEXTURE_FRAG: BindingLayout = {
    bindingType: 'texture',
    visibility: FRAGMENT,
};