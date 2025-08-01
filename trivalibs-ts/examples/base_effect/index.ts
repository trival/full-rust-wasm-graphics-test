import {
    Painter,
    type CanvasApp,
    type Event,
    BindingBuffer,
    BINDING_BUFFER_FRAG,
    uvec2,
} from '../../src/index';
import { fragmentShader } from './shaders.js';

class BaseEffectApp implements CanvasApp {
    private time = 0;
    private uTime!: BindingBuffer<number>;
    private uSize!: BindingBuffer<Uint32Array>;
    private canvas!: any; // Layer type
    
    // FPS tracking
    private frameCount = 0;
    private fpsAccumulator = 0;
    private fpsElement!: HTMLElement;

    async init(painter: Painter): Promise<void> {
        // Create effect shader
        const shader = painter.shaderEffect()
            .withBindings([BINDING_BUFFER_FRAG, BINDING_BUFFER_FRAG])
            .withFragmentShader(fragmentShader)
            .create();

        // Create bindings
        this.uTime = painter.bindF32();
        this.uSize = painter.bindUVec2();

        // Create effect
        const effect = painter.effect(shader.id)
            .withBindings({
                0: this.uSize,
                1: this.uTime,
            })
            .create();

        // Create layer with effect
        this.canvas = painter.layer()
            .withWindowSize()
            .withEffect(effect)
            .create();
        
        // Get FPS element
        this.fpsElement = document.getElementById('fps')!;
    }

    resize(painter: Painter, width: number, height: number): void {
        const size = new Uint32Array([width, height]);
        this.uSize.update(size);
    }

    update(painter: Painter, deltaTime: number): void {
        // Update time
        this.time += deltaTime;
        this.uTime.update(this.time);
        
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
        // The layer will handle rendering the effect
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
    const app = new BaseEffectApp();
    painter.runApp(app, { showFps: true });
}

// Start the app
main().catch(console.error);