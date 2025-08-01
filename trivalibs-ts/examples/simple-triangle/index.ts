import {
    Painter,
    type CanvasApp,
    type Event,
    BindingBuffer,
    type Vec3,
    type Vec4,
    type Mat4,
    vec3,
    vec4,
    mat4,
    Transform,
    PerspectiveCamera,
    type CameraProps,
    BINDING_BUFFER_VERT,
    BINDING_BUFFER_FRAG,
} from '../../src/index.js';
import { vertexShader, fragmentShader } from './shaders.js';

// Triangle vertices
const VERTICES: Vec3[] = [
    vec3.fromValues(0.0, 5.0, 0.0),
    vec3.fromValues(-2.5, 0.0, 0.0),
    vec3.fromValues(2.5, 0.0, 0.0),
];

// Color event type
interface ColorEvent {
    r: number;
    g: number;
    b: number;
}

class SimpleTriangleApp implements CanvasApp<ColorEvent> {
    private cam!: PerspectiveCamera;
    private transform!: Transform;
    private modelMat!: BindingBuffer<Mat4>;
    private vpMat!: BindingBuffer<Mat4>;
    private color!: BindingBuffer<Vec4>;
    private canvas!: any; // Layer type
    
    // FPS tracking
    private frameCount = 0;
    private fpsAccumulator = 0;
    private fpsElement!: HTMLElement;

    async init(painter: Painter): Promise<void> {
        // Create shader
        const shader = painter.shader()
            .withVertexAttributes(['float32x3'])
            .withBindings([
                BINDING_BUFFER_VERT,    // VP matrix
                BINDING_BUFFER_VERT,    // Model matrix
                BINDING_BUFFER_FRAG,    // Color
            ])
            .withVertexShader(vertexShader)
            .withFragmentShader(fragmentShader)
            .create();

        // Create form (vertex buffer)
        const form = painter.form()
            .withVertices(VERTICES)
            .create();

        // Create bindings
        this.modelMat = painter.bindMat4();
        this.vpMat = painter.bindMat4();
        this.color = painter.bindVec4();
        
        // Initialize color to red
        this.color.update(vec4.fromValues(1.0, 0.0, 0.0, 1.0));

        // Create shape
        const shape = painter.shape(form.id, shader.id)
            .withBindings({
                0: this.vpMat,
                1: this.modelMat,
                2: this.color,
            })
            .withCullMode(null)
            .withDepthWrite(false)
            .create(painter.format);

        // Create layer
        this.canvas = painter.layer()
            .withWindowSize()
            .withShape(shape)
            .withClearColor({ r: 0, g: 0, b: 0, a: 1 })
            .create();

        // Set up transform
        this.transform = new Transform();
        this.transform.translate(vec3.fromValues(0.0, -20.0, 0.0));
        this.transform.scale(vec3.fromValues(8.0, 8.0, 8.0));

        // Set up camera
        const camProps: CameraProps = {
            fov: 0.6,
            translation: vec3.fromValues(0.0, 0.0, 80.0),
            near: 0.1,
            far: 1000.0,
        };
        this.cam = new PerspectiveCamera(camProps);
        
        // Get FPS element
        this.fpsElement = document.getElementById('fps')!;
    }

    resize(painter: Painter, width: number, height: number): void {
        this.cam.setAspectRatio(width / height);
        this.vpMat.update(this.cam.getViewProjMatrix());
    }

    update(painter: Painter, deltaTime: number): void {
        // Rotate the triangle
        this.transform.rotateY(deltaTime * 0.5);
        this.modelMat.update(this.transform.getModelMatrix());
        
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
        painter.paintAndShow(this.canvas);
    }

    event(event: Event<ColorEvent>, painter: Painter): void {
        if (event.type === 'user') {
            const { r, g, b } = event.data;
            this.color.update(vec4.fromValues(r, g, b, 1.0));
        } else if (event.type === 'pause') {
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
    const app = new SimpleTriangleApp();
    const runner = painter.runApp(app);
    
    // Set up color picker
    const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
    colorPicker.addEventListener('input', (e) => {
        const color = (e.target as HTMLInputElement).value;
        const r = parseInt(color.substr(1, 2), 16) / 255;
        const g = parseInt(color.substr(3, 2), 16) / 255;
        const b = parseInt(color.substr(5, 2), 16) / 255;
        
        runner.sendEvent({ r, g, b });
    });
}

// Start the app
main().catch(console.error);