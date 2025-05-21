import * as THREE from "three";
import Entity from "./Entity.mjs";

var HealthEntity = class extends Entity {
    constructor(options) {
        super(options);
        this.maxHealth = options?.maxHealth ?? 100;
        this.health = options?.health ?? this.maxHealth;
        this.isHealthUnit = true;
    }

    updateHealthTexture(model, graphicsEngine) {
        if (!model?.mesh?.healthInfo) {
            return;
        }
        var ratio = this.health / this.maxHealth;
        
        model = model.mesh;
        if(this.health == model.healthInfo.health && this.maxHealth == model.healthInfo.maxHealth) {
            return;
        }
        var healthCanvas = model.healthInfo.canvas;
        var ctx = model.healthInfo.context;

        var texture = model.healthInfo.texture;
        ctx.clearRect(0, 0, healthCanvas.width, healthCanvas.height);

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, healthCanvas.width, healthCanvas.height);

        ctx.fillStyle = "green";
        
        ctx.fillRect(0, 0, healthCanvas.width * ratio, healthCanvas.height);
        model.healthInfo.health = this.health;
        model.healthInfo.maxHealth = this.maxHealth;
        texture.needsUpdate = true;
    }

    makeHealthSprite(model, scale, position) {
        if (!model?.mesh) {
            return;
        }
        model = model.mesh;
        var canv = document.createElement("canvas");
        canv.width = 64;
        canv.height = 32;
        var ctx = canv.getContext("2d");

        var texture = new THREE.CanvasTexture(canv);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        var material = new THREE.SpriteMaterial({
            map: texture
        });
        var sprite = new THREE.Sprite(material);
        model.healthInfo = {
            canvas: canv,
            context: ctx,
            sprite: sprite,
            texture: texture,
            health: null,
            maxHealth: null
        }
        sprite.scale.set(...scale);
        sprite.position.set(...position);
        model.add(sprite);
    }

    toJSON() {
        var json = {};
        json.health = this.health;
        return json;
    }

    static fromJSON(json, world) {
        var healthUnit = new this();
        healthUnit.health = json.health;
        return healthUnit;
    }
}


export default HealthEntity;