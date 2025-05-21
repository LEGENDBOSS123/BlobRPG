import Vector3 from "../../Physics/Math3D/Vector3.mjs";
import * as THREE from "three";

var Particle = class {
    constructor(options) {
        this.position = options?.position ?? new Vector3();
        this.velocity = options?.velocity ?? new Vector3();
        this.damping = options?.damping ?? 0;
        this.acceleration = options?.acceleration ?? new Vector3();
        this.duration = options?.duration ?? 0;
        this.fadeOutSpeed = options?.fadeOutSpeed ?? 0;
        this.fadeInSpeed = options?.fadeInSpeed ?? 0;
        this.shrinkSpeed = options?.shrinkSpeed ?? 0;
        this.growthSpeed = options?.growthSpeed ?? 0;
        this.startTime = null;
        this.size = options?.size ?? 10;
        this.color = options?.color ?? "white";
        this.swayStrength = options?.swayStrength ?? 0.2;
        this.swaySpeed = options?.swaySpeed ?? 0.01;
        this.canvas = {
            ctx: null,
            canvas: null,
            width: options?.canvasWidth ?? 64,
            height: options?.canvasHeight ?? 64,
        }
        this.texture = null;
        this.spriteMaterial = null;
        this.sprite = null;
        this.scene = null;
        this.createdCanvasTexture = false;
    }

    createCanvasTexture() {
        this.canvas.canvas = new OffscreenCanvas(0,0);
        this.canvas.ctx = this.canvas.canvas.getContext('2d');
        this.canvas.canvas.width = this.canvas.width;
        this.canvas.canvas.height = this.canvas.height;

        return new THREE.CanvasTexture(this.canvas.canvas);
    }

    updateCanvas(time) {
        if(this.createdText){
            return;
        }
        var canvas = this.canvas.canvas;
        var ctx = this.canvas.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, Math.min(canvas.width/2, canvas.height/2), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
        this.texture.needsUpdate = true;
        this.createdText = true;
    }

    setMeshAndAddToScene(options, gameEngine) {
        this.texture = this.createCanvasTexture();
        this.spriteMaterial = new THREE.SpriteMaterial({ map: this.texture });
        this.sprite = new THREE.Sprite(this.spriteMaterial);
        this.sprite.scale.set(this.canvas.canvas.width / this.canvas.canvas.height * this.size, this.size, 1);
        this.scene = gameEngine.graphicsEngine.scene;
        this.scene.add(this.sprite);
    }

    disposeMesh() {
        this.scene.remove(this.sprite);
        this.spriteMaterial.map.dispose();
        this.spriteMaterial.dispose();
        this.spriteMaterial.map = null;
        this.sprite.material = null;

        this.texture = null;
        this.spriteMaterial = null;
        this.sprite = null;
        this.scene = null;
        this.canvas = {
            ctx: null,
            canvas: null
        }
    }

    removed() {
        this.disposeMesh();
    }

    update(time) {
        var dampedVelocity = this.velocity.scale(time);
        if (this.damping > 0) {
            dampedVelocity = this.velocity.scale(1 / this.damping * (1 - Math.exp(-this.damping * time)));
        }
        var position = this.position.add(dampedVelocity).addInPlace(this.acceleration.scale(time * time * 0.5));
        var sway = this.swayStrength * Math.sin(time * this.swaySpeed);
        this.updateCanvas(time);
        if(this.fadeOutSpeed > 0 || this.fadeInSpeed > 0) {
            var ratio = Math.max(0, Math.min(1, time / this.duration));
            var opacity = 1;
            if (ratio < this.fadeInSpeed) {
                opacity = ratio / this.fadeInSpeed;
            } else if (ratio > 1 - this.fadeOutSpeed) {
                opacity = 1 - (ratio - 1 + this.fadeOutSpeed) / this.fadeOutSpeed;
            }
            this.spriteMaterial.opacity = opacity;
        }
        var size = 1;
        if(this.shrinkSpeed > 0 || this.growthSpeed > 0) {
            var ratio = Math.max(0, Math.min(1, time / this.duration));
            if (ratio < this.growthSpeed) {
                size = ratio / this.growthSpeed;
            } else if (ratio > 1 - this.shrinkSpeed) {
                size = 1 - (ratio - 1 + this.shrinkSpeed) / this.shrinkSpeed;
            }
        }
        this.sprite.position.set(position.x, position.y, position.z);
        this.sprite.material.rotation = sway;
        this.sprite.scale.set(this.canvas.canvas.width / this.canvas.canvas.height * this.size * size, this.size * size, 1);
        
    }
}


export default Particle;