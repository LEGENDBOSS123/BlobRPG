import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Entity from "./Entity.mjs";

var HealthEntity = class extends Entity {
    constructor(options) {
        super(options);
        this.maxHealth = options?.maxHealth ?? 100;
        this.health = options?.health ?? this.maxHealth;
        this.isHealthUnit = true;
        this.healthInfo = {
            health: this.health,
            maxHealth: this.maxHealth,
            canvas: null,
            context: null,
            texture: null,
            position: options?.position ?? new Vector3(),
            scale: options?.scale ?? new Vector3(1,1,1)
        };
        this.healthSprite = null;
    }

    updateHealthTexture(force = false) {
        if (!this.healthInfo.canvas) {
            return;
        }
        var ratio = this.health / this.maxHealth;

        if (this.health == this.healthInfo.health && this.maxHealth == this.healthInfo.maxHealth && !force) {
            return;
        }
        var healthCanvas = this.healthInfo.canvas;
        var ctx = this.healthInfo.context;

        var texture = this.healthInfo.texture;
        ctx.clearRect(0, 0, healthCanvas.width, healthCanvas.height);

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, healthCanvas.width, healthCanvas.height);

        ctx.fillStyle = "green";
        ctx.fillRect(0, 0, healthCanvas.width * ratio, healthCanvas.height);
        this.healthInfo.health = this.health;
        this.healthInfo.maxHealth = this.maxHealth;
        texture.needsUpdate = true;
    }

    makeHealthSprite(scale, position) {
        var canv = document.createElement("canvas");
        canv.width = 64;
        canv.height = 32;
        var ctx = canv.getContext("2d");

        var texture = new this.gameEngine.graphicsEngine.THREE.CanvasTexture(canv);
        texture.minFilter = this.gameEngine.graphicsEngine.THREE.NearestFilter;
        texture.magFilter = this.gameEngine.graphicsEngine.THREE.NearestFilter;

        var material = new this.gameEngine.graphicsEngine.THREE.SpriteMaterial({
            map: texture
        });
        var sprite = new this.gameEngine.graphicsEngine.THREE.Sprite(material);
        sprite.scale.set(...scale);
        sprite.position.set(...position);

        this.healthSprite = sprite;
        this.healthInfo.health = this.health;
        this.healthInfo.maxHealth = this.maxHealth;
        this.healthInfo.canvas = canv;
        this.healthInfo.context = ctx;
        this.healthInfo.texture = texture;
        this.healthInfo.position = position;
        this.healthInfo.scale = scale;
        this.updateHealthTexture(true);
    }

    isAlive(){
        return this.health > 0;
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