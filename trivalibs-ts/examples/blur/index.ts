import {
    Painter,
    type CanvasApp,
    type Event,
    BindingBuffer,
    BINDING_BUFFER_FRAG,
    BINDING_SAMPLER_FRAG,
    vec2Create,
    type Vec2,
    Effect,
} from '../../src/index';
import { triangleVertexShader, triangleFragmentShader, blurFragmentShader } from './shaders.js';

const BLUR_DIAMETER = 100.0; // Reduced for web performance

interface Vertex {
    pos: Vec2;
    uv: Vec2;
}

const TRIANGLE: Vertex[] = [
    { pos: vec2Create(-0.7, -0.7), uv: vec2Create(0.0, 1.0) },
    { pos: vec2Create(0.7, -0.7), uv: vec2Create(1.0, 1.0) },
    { pos: vec2Create(0.0, 0.7), uv: vec2Create(0.5, 0.0) },
];

class BlurApp implements CanvasApp {
    private canvas!: any; // Layer type
    private size!: BindingBuffer<Vec2>;
    
    // FPS tracking
    private frameCount = 0;
    private fpsAccumulator = 0;
    private fpsElement!: HTMLElement;

    async init(painter: Painter): Promise<void> {
        // Create triangle shader
        const triangleShader = painter.shader()
            .withVertexAttributes(['float32x2', 'float32x2'])
            .withVertexShader(triangleVertexShader)
            .withFragmentShader(triangleFragmentShader)
            .create();

        // Create blur effect shader
        const blurShader = painter.shaderEffect()
            .withBindings([
                BINDING_BUFFER_FRAG,   // diameter
                BINDING_BUFFER_FRAG,   // resolution
                BINDING_BUFFER_FRAG,   // direction
                BINDING_SAMPLER_FRAG,  // sampler
            ])
            .withLayer()
            .withFragmentShader(blurFragmentShader)
            .create();

        // Create triangle form from vertex data
        const vertices = new Float32Array(TRIANGLE.flatMap(v => [
            v.pos[0], v.pos[1],
            v.uv[0], v.uv[1]
        ]));
        const triangleForm = painter.form()
            .withRawVertices(vertices, 3)
            .create();

        // Create triangle shape
        const triangleShape = painter.shape(triangleForm.id, triangleShader.id).create();

        // Create bindings for blur
        this.size = painter.bindVec2();
        const horizontal = painter.bindConstVec2(vec2Create(1.0, 0.0));
        const vertical = painter.bindConstVec2(vec2Create(0.0, 1.0));
        const sampler = painter.samplerLinear();

        // Create multi-pass blur effects
        const effects: Effect[] = [];
        
        // Multi-pass approach for better performance
        let counter = BLUR_DIAMETER / 9.0; // Fixed diameter in shader is 9.0
        while (counter > 2.0) {
            const diameter = painter.bindConstF32(counter);
            
            // Horizontal blur pass
            effects.push(
                painter.effect(blurShader.id)
                    .withBindings({
                        0: diameter,
                        1: this.size,
                        2: horizontal,
                        3: { type: 'sampler', samplerId: sampler },
                    })
                    .create()
            );
            
            // Vertical blur pass
            effects.push(
                painter.effect(blurShader.id)
                    .withBindings({
                        0: diameter,
                        1: this.size,
                        2: vertical,
                        3: { type: 'sampler', samplerId: sampler },
                    })
                    .create()
            );
            
            counter /= 2.0;
        }
        
        console.log(`Created ${effects.length} blur passes`);

        // Create layer with triangle and blur effects
        this.canvas = painter.layer()
            .withWindowSize()
            .withShape(triangleShape)
            .withEffects(effects)
            .withClearColor({ r: 0, g: 0, b: 1, a: 1 })
            .create();
        
        // Get FPS element
        this.fpsElement = document.getElementById('fps')!;
    }

    resize(painter: Painter, width: number, height: number): void {
        this.size.update(vec2Create(width, height));
    }

    update(painter: Painter, deltaTime: number): void {
        // Update FPS counter
        this.frameCount++;
        this.fpsAccumulator += deltaTime;
        
        if (this.fpsAccumulator >= 1.0) {
            this.fpsElement.textContent = `FPS: ${this.frameCount}`;
            this.frameCount = 0;
            this.fpsAccumulator = 0;
        }
    }

    render(painter: Painter): void {
        const encoder = painter.device.createCommandEncoder();
        this.canvas.render(encoder);
        painter.device.queue.submit([encoder.finish()]);
    }

    event(event: Event, painter: Painter): void {
        if (event.type === 'pause') {
            const pausedElement = document.getElementById('paused');
            if (pausedElement) {
                pausedElement.style.display = event.paused ? 'block' : 'none';
            }
        }
    }
}

// Main entry point
async function main() {
    const canvas = document.getElementById('render-canvas') as HTMLCanvasElement;
    
    // Create painter
    const painter = new Painter();
    await painter.init(canvas);
    
    // Create and run app
    const app = new BlurApp();
    painter.runApp(app, { showFps: true });
}

// Start the app
main().catch(console.error);