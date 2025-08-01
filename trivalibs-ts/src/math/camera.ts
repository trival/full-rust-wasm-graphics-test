/**
 * Camera implementations for trivalibs-ts
 */

import { vec3, mat4 } from 'gl-matrix';
import type { Vec3, Mat4 } from './index.js';

export interface CameraProps {
    fov?: number;
    aspectRatio?: number;
    near?: number;
    far?: number;
    translation?: Vec3;
    target?: Vec3;
    up?: Vec3;
}

export class PerspectiveCamera {
    private fov: number;
    private aspectRatio: number;
    private near: number;
    private far: number;
    private position: Vec3;
    private target: Vec3;
    private up: Vec3;
    
    private viewMatrix: Mat4;
    private projMatrix: Mat4;
    private viewProjMatrix: Mat4;
    private isDirty = true;
    
    constructor(props: CameraProps = {}) {
        this.fov = props.fov ?? Math.PI / 4;
        this.aspectRatio = props.aspectRatio ?? 1.0;
        this.near = props.near ?? 0.1;
        this.far = props.far ?? 1000.0;
        this.position = props.translation ? vec3.clone(props.translation) : vec3.fromValues(0, 0, 10);
        this.target = props.target ? vec3.clone(props.target) : vec3.create();
        this.up = props.up ? vec3.clone(props.up) : vec3.fromValues(0, 1, 0);
        
        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.viewProjMatrix = mat4.create();
        
        this.updateMatrices();
    }
    
    setPosition(position: Vec3): void {
        vec3.copy(this.position, position);
        this.isDirty = true;
    }
    
    setTarget(target: Vec3): void {
        vec3.copy(this.target, target);
        this.isDirty = true;
    }
    
    setUp(up: Vec3): void {
        vec3.copy(this.up, up);
        this.isDirty = true;
    }
    
    setFov(fov: number): void {
        this.fov = fov;
        this.isDirty = true;
    }
    
    setAspectRatio(aspectRatio: number): void {
        this.aspectRatio = aspectRatio;
        this.isDirty = true;
    }
    
    setNearFar(near: number, far: number): void {
        this.near = near;
        this.far = far;
        this.isDirty = true;
    }
    
    getViewMatrix(): Mat4 {
        if (this.isDirty) {
            this.updateMatrices();
        }
        return this.viewMatrix;
    }
    
    getProjectionMatrix(): Mat4 {
        if (this.isDirty) {
            this.updateMatrices();
        }
        return this.projMatrix;
    }
    
    getViewProjMatrix(): Mat4 {
        if (this.isDirty) {
            this.updateMatrices();
        }
        return this.viewProjMatrix;
    }
    
    private updateMatrices(): void {
        // Update view matrix
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        
        // Update projection matrix
        mat4.perspective(this.projMatrix, this.fov, this.aspectRatio, this.near, this.far);
        
        // Combine view and projection
        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);
        
        this.isDirty = false;
    }
}