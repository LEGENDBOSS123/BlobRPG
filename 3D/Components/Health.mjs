import Vector3 from "../Physics/Math3D/Vector3.mjs";

class Health {
    constructor(options) {
        this.maxHealth = options?.maxHealth ?? 100;
        this.health = options?.health ?? this.maxHealth;

        this.invincibilityFramesDuration = options?.invincibilityFramesDuration ?? 300;
        this.lastDamageTime = options?.lastDamageTime ?? 0;
        this.lastDamage = options?.lastDamage ?? 0;

        this.parent = options.parent;

        this.onDamage = options?.onDamage ?? null;
        this.onDefeat = options?.onDefeat ?? null;

        this.healthInfo = {
            health: this.health,
            maxHealth: this.maxHealth,
            canvas: null,
            context: null,
            texture: null,
            position: options?.position ?? new Vector3(),
            scale: options?.scale ?? new Vector3(1, 1, 1)
        };
        this.healthSprite = null;
    }

    isAlive() {
        return this.health > 0;
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
        canv.width = 100;
        canv.height = 1;
        var ctx = canv.getContext("2d");

        var texture = new this.parent.gameEngine.graphicsEngine.THREE.CanvasTexture(canv);
        texture.minFilter = this.parent.gameEngine.graphicsEngine.THREE.NearestFilter;
        texture.magFilter = this.parent.gameEngine.graphicsEngine.THREE.NearestFilter;

        var material = new this.parent.gameEngine.graphicsEngine.THREE.SpriteMaterial({
            map: texture
        });
        var sprite = new this.parent.gameEngine.graphicsEngine.THREE.Sprite(material);
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

    takeDamage(damage) {
        if (this.health <= 0) {
            return;
        }
        const time = this.parent.gameEngine.timer.getTime();
        if (time - this.lastDamageTime < this.invincibilityFramesDuration && damage <= this.lastDamage) {
            return false;
        }

        if (damage > this.lastDamage) {
            damage = damage - this.lastDamage;
        }

        this.lastDamageTime = time;
        damage = Math.min(damage, this.health);
        this.lastDamage = damage;
        this.health -= damage;

        this.onDamage?.(damage);
        if (this.health <= 0) {
            this.onDefeat?.(damage);
        }
    }

    destroy() {
        this.healthSprite = null;
        this.healthInfo = null;
        this.parent = null;
    }

    toJSON() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            invincibilityFramesDuration: this.invincibilityFramesDuration,
            lastDamageTime: this.lastDamageTime,
            lastDamage: this.lastDamage
        }
    }

    static fromJSON(json) {
        return new Health({
            health: json.health,
            maxHealth: json.maxHealth,
            invincibilityFramesDuration: json.invincibilityFramesDuration,
            lastDamageTime: json.lastDamageTime,
            lastDamage: json.lastDamage
        })
    }
}

export default Health;