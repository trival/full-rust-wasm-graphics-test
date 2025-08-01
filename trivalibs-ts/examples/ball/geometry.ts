import { vec2, vec3, type Vec2, type Vec3 } from '../../src/index.js';

export interface Vertex {
    position: Vec3;
    uv: Vec2;
    normal: Vec3;
    color: Vec3;
}

export interface BufferedGeometry {
    vertexBuffer: Float32Array;
    indexBuffer?: Uint32Array;
    vertexCount: number;
    indexCount: number;
}

// Convert spherical angles to cartesian coordinates
function anglesToCartesian(horizAngle: number, vertAngle: number): Vec3 {
    const y = Math.sin(vertAngle);
    const xz = Math.cos(vertAngle);
    const x = xz * Math.cos(horizAngle);
    const z = xz * Math.sin(horizAngle);
    return vec3.fromValues(x, y, z);
}

function createVertex(position: Vec3, uv: Vec2, normal: Vec3, color: Vec3): Vertex {
    return { position, uv, normal, color };
}

export function createBallGeometry(
    verticalSegments: number = 50,
    horizontalSegments: number = 50,
    radius: number = 5.0
): BufferedGeometry {
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    
    // Generate vertices
    for (let v = 0; v <= verticalSegments; v++) {
        const vertAngle = (v / verticalSegments - 0.5) * Math.PI;
        
        for (let h = 0; h <= horizontalSegments; h++) {
            const horizAngle = (h / horizontalSegments) * Math.PI * 2;
            
            // Calculate position
            const normal = anglesToCartesian(horizAngle, vertAngle);
            const position = vec3.create();
            vec3.scale(position, normal, radius);
            
            // Calculate UV coordinates
            const uv = vec2.fromValues(
                h / horizontalSegments,
                v / verticalSegments
            );
            
            // Calculate color based on position (will be overridden per face)
            const color = vec3.fromValues(0.5, 0.5, 0.5);
            
            vertices.push(createVertex(position, uv, normal, color));
        }
    }
    
    // Generate indices and apply face colors
    const faceColors: Vec3[] = [];
    
    for (let v = 0; v < verticalSegments; v++) {
        for (let h = 0; h < horizontalSegments; h++) {
            const a = v * (horizontalSegments + 1) + h;
            const b = a + horizontalSegments + 1;
            const c = a + 1;
            const d = b + 1;
            
            // Create two triangles for each quad
            indices.push(a, b, c);
            indices.push(b, d, c);
            
            // Generate random color for this face
            const useHorizGradient = (h * verticalSegments) % 2 === 0;
            const gradient = useHorizGradient ? h / horizontalSegments : v / verticalSegments;
            const baseColor = vec3.fromValues(
                Math.random() * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            );
            const faceColor = vec3.create();
            vec3.scale(faceColor, vec3.fromValues(gradient, gradient, gradient), 0.8);
            vec3.add(faceColor, faceColor, baseColor);
            
            faceColors.push(faceColor, faceColor); // One for each triangle
        }
    }
    
    // Apply face colors to vertices (averaging for shared vertices)
    const vertexColorCounts = new Array(vertices.length).fill(0);
    const vertexColors = vertices.map(() => vec3.create());
    
    for (let i = 0; i < indices.length; i += 3) {
        const faceIndex = Math.floor(i / 3);
        const faceColor = faceColors[faceIndex];
        
        for (let j = 0; j < 3; j++) {
            const vertexIndex = indices[i + j];
            vec3.add(vertexColors[vertexIndex], vertexColors[vertexIndex], faceColor);
            vertexColorCounts[vertexIndex]++;
        }
    }
    
    // Average the colors
    for (let i = 0; i < vertices.length; i++) {
        if (vertexColorCounts[i] > 0) {
            vec3.scale(vertices[i].color, vertexColors[i], 1 / vertexColorCounts[i]);
        }
    }
    
    // Pack vertices into buffer
    // Layout: position (3), uv (2), normal (3), color (3) = 11 floats per vertex
    const vertexBuffer = new Float32Array(vertices.length * 11);
    let offset = 0;
    
    for (const vertex of vertices) {
        vertexBuffer[offset++] = vertex.position[0];
        vertexBuffer[offset++] = vertex.position[1];
        vertexBuffer[offset++] = vertex.position[2];
        
        vertexBuffer[offset++] = vertex.uv[0];
        vertexBuffer[offset++] = vertex.uv[1];
        
        vertexBuffer[offset++] = vertex.normal[0];
        vertexBuffer[offset++] = vertex.normal[1];
        vertexBuffer[offset++] = vertex.normal[2];
        
        vertexBuffer[offset++] = vertex.color[0];
        vertexBuffer[offset++] = vertex.color[1];
        vertexBuffer[offset++] = vertex.color[2];
    }
    
    return {
        vertexBuffer,
        indexBuffer: new Uint32Array(indices),
        vertexCount: vertices.length,
        indexCount: indices.length,
    };
}