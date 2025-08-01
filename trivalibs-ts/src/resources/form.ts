/**
 * Form system - manages vertex and index buffers
 */

import type { Painter } from '../core/painter.js';
import type { Vec3 } from '../math/index.js';

export interface FormProps {
    topology?: GPUPrimitiveTopology;
    frontFace?: GPUFrontFace;
}

export class Form {
    constructor(
        public readonly id: number,
        public readonly vertexBufferId: number,
        public readonly indexBufferId: number | null,
        public readonly vertexCount: number,
        public readonly indexCount: number,
        public readonly props: Required<FormProps>
    ) {}
}

export interface FormData<T> {
    vertices: T[];
    indices?: Uint32Array;
}

export class FormBuilder {
    private vertices?: ArrayBuffer | ArrayBufferView;
    private indices?: Uint32Array;
    private vertexCount = 0;
    private indexCount = 0;
    private props: FormProps = {};
    
    constructor(private painter: Painter) {}
    
    withVertices<T>(vertices: T[]): this {
        if (vertices.length === 0) {
            throw new Error('Cannot create form with empty vertex array');
        }
        
        // Handle Vec3 array
        const firstVertex = vertices[0];
        if (firstVertex && typeof firstVertex === 'object' && 'length' in firstVertex) {
            const floatArray = new Float32Array(vertices.length * 3);
            let offset = 0;
            for (const vertex of vertices) {
                const v = vertex as unknown as number[];
                floatArray[offset++] = v[0];
                floatArray[offset++] = v[1];
                floatArray[offset++] = v[2];
            }
            this.vertices = floatArray;
            this.vertexCount = vertices.length;
        } else {
            throw new Error('Unsupported vertex type');
        }
        
        return this;
    }
    
    withRawVertices(data: ArrayBuffer | ArrayBufferView, count: number): this {
        this.vertices = data;
        this.vertexCount = count;
        return this;
    }
    
    withVertexData(data: Float32Array): this {
        return this.withRawVertices(data, -1); // -1 means auto-calculate from shader
    }
    
    withVertexCount(count: number): this {
        this.vertexCount = count;
        return this;
    }
    
    withIndices(indices: Uint32Array): this {
        this.indices = indices;
        this.indexCount = indices.length;
        return this;
    }
    
    withTopology(topology: GPUPrimitiveTopology): this {
        this.props.topology = topology;
        return this;
    }
    
    withFrontFace(frontFace: GPUFrontFace): this {
        this.props.frontFace = frontFace;
        return this;
    }
    
    create(): Form {
        if (!this.vertices) {
            throw new Error('Vertices must be provided');
        }
        
        // Create vertex buffer
        const vertexBuffer = this.painter.device.createBuffer({
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        
        new Uint8Array(vertexBuffer.getMappedRange()).set(
            new Uint8Array(this.vertices instanceof ArrayBuffer ? this.vertices : this.vertices.buffer)
        );
        vertexBuffer.unmap();
        
        const vertexBufferId = this.painter.addBuffer(vertexBuffer);
        
        // Create index buffer if provided
        let indexBufferId: number | null = null;
        if (this.indices) {
            const indexBuffer = this.painter.device.createBuffer({
                size: this.indices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            
            new Uint32Array(indexBuffer.getMappedRange()).set(this.indices);
            indexBuffer.unmap();
            
            indexBufferId = this.painter.addBuffer(indexBuffer);
        }
        
        // Apply defaults
        const finalProps: Required<FormProps> = {
            topology: this.props.topology ?? 'triangle-list',
            frontFace: this.props.frontFace ?? 'ccw',
        };
        
        const form = new Form(
            this.painter.forms.length, // id
            vertexBufferId,
            indexBufferId,
            this.vertexCount,
            this.indexCount,
            finalProps
        );
        
        this.painter.forms.push(form);
        return form;
    }
}

// Helper to create a form from a simple vertex array
export function createFormFromVertices(painter: Painter, vertices: Vec3[]): Form {
    return painter.form()
        .withVertices(vertices)
        .create();
}