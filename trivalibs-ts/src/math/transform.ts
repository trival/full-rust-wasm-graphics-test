/**
 * Transform class for managing object transformations
 */

import { vec3, mat4, quat } from 'gl-matrix';
import type { Vec3, Mat4, Quat } from './index.js';

export class Transform {
    private position: Vec3;
    private rotation: Quat;
    private scaling: Vec3;
    private modelMatrix: Mat4;
    private isDirty = true;
    
    constructor() {
        this.position = vec3.create();
        this.rotation = quat.create();
        this.scaling = vec3.fromValues(1, 1, 1);
        this.modelMatrix = mat4.create();
    }
    
    translate(translation: Vec3): void {
        vec3.add(this.position, this.position, translation);
        this.isDirty = true;
    }
    
    setTranslation(position: Vec3): void {
        vec3.copy(this.position, position);
        this.isDirty = true;
    }
    
    rotateX(radians: number): void {
        quat.rotateX(this.rotation, this.rotation, radians);
        this.isDirty = true;
    }
    
    rotateY(radians: number): void {
        quat.rotateY(this.rotation, this.rotation, radians);
        this.isDirty = true;
    }
    
    rotateZ(radians: number): void {
        quat.rotateZ(this.rotation, this.rotation, radians);
        this.isDirty = true;
    }
    
    setRotation(rotation: Quat): void {
        quat.copy(this.rotation, rotation);
        this.isDirty = true;
    }
    
    scale(scale: Vec3): void {
        vec3.multiply(this.scaling, this.scaling, scale);
        this.isDirty = true;
    }
    
    setScale(scale: Vec3): void {
        vec3.copy(this.scaling, scale);
        this.isDirty = true;
    }
    
    getModelMatrix(): Mat4 {
        if (this.isDirty) {
            // Create translation matrix
            mat4.fromTranslation(this.modelMatrix, this.position);
            
            // Apply rotation
            const rotMat = mat4.create();
            mat4.fromQuat(rotMat, this.rotation);
            mat4.multiply(this.modelMatrix, this.modelMatrix, rotMat);
            
            // Apply scale
            mat4.scale(this.modelMatrix, this.modelMatrix, this.scaling);
            
            this.isDirty = false;
        }
        
        return this.modelMatrix;
    }
    
    getPosition(): Vec3 {
        return vec3.clone(this.position);
    }
    
    getRotation(): Quat {
        return quat.clone(this.rotation);
    }
    
    getScale(): Vec3 {
        return vec3.clone(this.scaling);
    }
}