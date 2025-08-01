import {
    Painter,
    type CanvasApp,
    type Event,
    BindingBuffer,
    type Mat4,
    type Mat3,
    type Vec3,
    vec3,
    mat3,
    mat4,
    Transform,
    PerspectiveCamera,
    type CameraProps,
    BINDING_BUFFER_VERT,
    BINDING_SAMPLER_FRAG,
    BINDING_TEXTURE_FRAG,
    type ValueBinding,
} from '../../src/index';
import { vertexShader, fragmentShader } from './shaders.js';
import { createBallGeometry } from './geometry.js';

class BallApp implements CanvasApp {
    private cam!: PerspectiveCamera;
    private ballTransform!: Transform;
    private mvp!: BindingBuffer<Mat4>;
    private normalMatrix!: BindingBuffer<Mat3>;
    private canvas!: any; // Layer type
    
    // FPS tracking
    private frameCount = 0;
    private fpsAccumulator = 0;
    private fpsElement!: HTMLElement;

    async init(painter: Painter): Promise<void> {
        // Load texture
        const textureResponse = await fetch('./texture.png');
        const textureBlob = await textureResponse.blob();
        const imageBitmap = await createImageBitmap(textureBlob);
        
        // Create texture layer
        const textureData = new Uint8Array(imageBitmap.width * imageBitmap.height * 4);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageBitmap.width;
        tempCanvas.height = imageBitmap.height;
        const ctx = tempCanvas.getContext('2d')!;
        ctx.drawImage(imageBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
        textureData.set(imageData.data);
        
        const textureLayer = painter.layer()
            .withSize(imageBitmap.width, imageBitmap.height)
            .withStaticTextureData(textureData)
            .withFormat('rgba8unorm-srgb')
            .create();
        
        // Create shader
        const shader = painter.shader()
            .withVertexAttributes(['float32x3', 'float32x2', 'float32x3', 'float32x3'])
            .withBindings([
                BINDING_BUFFER_VERT,    // MVP matrix
                BINDING_BUFFER_VERT,    // Normal matrix
                BINDING_SAMPLER_FRAG,   // Sampler
            ])
            .withLayers([BINDING_TEXTURE_FRAG]) // Texture in separate bind group
            .withVertexShader(vertexShader)
            .withFragmentShader(fragmentShader)
            .create();

        // Create geometry
        const ballGeom = createBallGeometry();
        const form = painter.form()
            .withRawVertices(ballGeom.vertexBuffer, ballGeom.vertexCount)
            .withIndices(ballGeom.indexBuffer!)
            .create();

        // Create bindings
        this.mvp = painter.bindMat4();
        this.normalMatrix = painter.bindMat3();
        const samplerId = painter.samplerLinear();

        // Create shape
        const shape = painter.shape(form.id, shader.id)
            .withBindings({
                0: this.mvp,
                1: this.normalMatrix,
                2: { type: 'sampler', samplerId } as ValueBinding,
            })
            .withLayers({
                0: textureLayer.binding(),
            })
            .withCullMode('back')
            .withDepthWrite(true)
            .create(painter.format);

        // Create canvas layer
        this.canvas = painter.layer()
            .withWindowSize()
            .withShape(shape)
            .withClearColor({ r: 0.5, g: 0.6, b: 0.7, a: 1.0 })
            .withDepthTest(true)
            .create();

        // Set up camera
        const camProps: CameraProps = {
            fov: 0.65,
            translation: vec3.fromValues(0.0, 5.0, 0.0),
            near: 0.1,
            far: 1000.0,
        };
        this.cam = new PerspectiveCamera(camProps);
        
        // Rotate camera down slightly
        const lookAt = vec3.fromValues(0, 0, -20);
        this.cam.setTarget(lookAt);

        // Set up transform
        this.ballTransform = new Transform();
        this.ballTransform.setTranslation(vec3.fromValues(0.0, 0.0, -20.0));
        
        // Get FPS element
        this.fpsElement = document.getElementById('fps')!;
    }

    resize(painter: Painter, width: number, height: number): void {
        this.cam.setAspectRatio(width / height);
    }

    update(painter: Painter, deltaTime: number): void {
        // Rotate the ball
        this.ballTransform.rotateY(deltaTime * 0.5);
        
        // Update MVP matrix
        const modelMatrix = this.ballTransform.getModelMatrix();
        const viewMatrix = this.cam.getViewMatrix();
        const projMatrix = this.cam.getProjectionMatrix();
        
        const viewModel = mat4.create();
        mat4.multiply(viewModel, viewMatrix, modelMatrix);
        
        const mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, projMatrix, viewModel);
        this.mvp.update(mvpMatrix);
        
        // Update normal matrix (inverse transpose of view-model matrix)
        const normalMat3 = mat3.create();
        mat3.normalFromMat4(normalMat3, viewModel);
        this.normalMatrix.update(normalMat3);
        
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
    const app = new BallApp();
    painter.runApp(app, { showFps: true });
}

// Start the app
main().catch(console.error);