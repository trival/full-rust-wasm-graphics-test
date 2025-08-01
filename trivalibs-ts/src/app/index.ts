/**
 * Application framework for trivalibs-ts
 */

import { Painter } from '../core/painter.js';
import type { Layer } from '../rendering/layer.js';

export type Event<T = any> = 
    | { type: 'resize'; width: number; height: number }
    | { type: 'user'; data: T }
    | { type: 'mouse'; event: MouseEvent }
    | { type: 'keyboard'; event: KeyboardEvent }
    | { type: 'pause'; paused: boolean };

export interface CanvasApp<UserEvent = any> {
    init(painter: Painter): Promise<void>;
    resize?(painter: Painter, width: number, height: number): void;
    update?(painter: Painter, deltaTime: number): void;
    render(painter: Painter): void;
    event?(event: Event<UserEvent>, painter: Painter): void;
    destroy?(): void;
}

export interface AppConfig {
    showFps?: boolean;
    targetFps?: number;
}

export class AppRunner<UserEvent = any> {
    private isRunning = false;
    private lastFrameTime = 0;
    private frameCount = 0;
    private fpsAccumulator = 0;
    private app?: CanvasApp<UserEvent>;
    private animationFrameId?: number;
    
    constructor(
        private painter: Painter,
        private config: AppConfig = {}
    ) {}
    
    async run(app: CanvasApp<UserEvent>): Promise<void> {
        this.app = app;
        
        // Initialize app
        await app.init(this.painter);
        
        // Set up resize observer
        this.setupResizeObserver();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial resize
        const { width, height } = this.painter.canvasSize;
        if (app.resize) {
            app.resize(this.painter, width, height);
        }
        
        // Start render loop
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.renderLoop();
    }
    
    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }
        if (this.app?.destroy) {
            this.app.destroy();
        }
    }
    
    pause(): void {
        this.isRunning = false;
        if (this.app?.event) {
            this.app.event({ type: 'pause', paused: true }, this.painter);
        }
    }
    
    play(): void {
        this.isRunning = true;
        this.lastFrameTime = performance.now(); // Reset time to avoid huge delta
        if (this.app?.event) {
            this.app.event({ type: 'pause', paused: false }, this.painter);
        }
        this.renderLoop(); // Restart the render loop
    }
    
    togglePause(): void {
        if (this.isRunning) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    get paused(): boolean {
        return !this.isRunning;
    }
    
    sendEvent(data: UserEvent): void {
        if (this.app?.event) {
            this.app.event({ type: 'user', data }, this.painter);
        }
    }
    
    private renderLoop = (): void => {
        if (!this.app) {
            return;
        }
        
        if (!this.isRunning) {
            // Stop the loop when paused
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // FPS tracking
        if (this.config.showFps) {
            this.frameCount++;
            this.fpsAccumulator += deltaTime;
            
            if (this.fpsAccumulator >= 1.0) {
                console.log(`FPS: ${this.frameCount}`);
                this.frameCount = 0;
                this.fpsAccumulator = 0;
            }
        }
        
        // Update
        if (this.app.update) {
            this.app.update(this.painter, deltaTime);
        }
        
        // Render
        this.app.render(this.painter);
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.renderLoop);
    };
    
    private setupResizeObserver(): void {
        const canvas = this.painter.canvas;
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const devicePixelRatio = window.devicePixelRatio || 1;
                
                const newWidth = Math.floor(width * devicePixelRatio);
                const newHeight = Math.floor(height * devicePixelRatio);
                
                if (canvas.width !== newWidth || canvas.height !== newHeight) {
                    this.painter.resize(newWidth, newHeight);
                    
                    if (this.app?.resize) {
                        this.app.resize(this.painter, newWidth, newHeight);
                    }
                    
                    if (this.app?.event) {
                        this.app.event({ type: 'resize', width: newWidth, height: newHeight }, this.painter);
                    }
                }
            }
        });
        
        resizeObserver.observe(canvas);
    }
    
    private setupEventListeners(): void {
        const canvas = this.painter.canvas;
        
        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.handleMouseEvent(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseEvent(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseEvent(e));
        
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyboardEvent(e));
        window.addEventListener('keyup', (e) => this.handleKeyboardEvent(e));
    }
    
    private handleMouseEvent(event: MouseEvent): void {
        if (this.app?.event) {
            this.app.event({ type: 'mouse', event }, this.painter);
        }
    }
    
    private handleKeyboardEvent(event: KeyboardEvent): void {
        // Handle built-in controls on keydown only
        if (event.type === 'keydown' && event.key === ' ') {
            event.preventDefault();
            this.togglePause();
        }
        
        // Pass to app
        if (this.app?.event) {
            this.app.event({ type: 'keyboard', event }, this.painter);
        }
    }
}

// Extension to Painter for convenience methods
declare module '../core/painter.js' {
    interface Painter {
        canvas: HTMLCanvasElement;
        paintAndShow(layer: Layer): void;
        runApp<T>(app: CanvasApp<T>, config?: AppConfig): AppRunner<T>;
    }
}

// Add convenience methods to Painter
Painter.prototype.paintAndShow = function(layer: Layer): void {
    const encoder = this.device.createCommandEncoder();
    layer.render(encoder);
    this.device.queue.submit([encoder.finish()]);
};

Painter.prototype.runApp = function<T>(app: CanvasApp<T>, config?: AppConfig): AppRunner<T> {
    const runner = new AppRunner<T>(this, config);
    runner.run(app);
    return runner;
};