import Entity from "./Entity.mjs";

class BattleManager extends Entity {
    constructor(options) {
        super(options);
        this.players = options.players ?? [];
        this.enemies = options.enemies ?? [];
        this.activeEnemies = new Set();
        this.defeatedEnemies = new Set();
        this.trigger = options.trigger ?? null;
        this.scene = options.scene ?? "dirt_arena"
        this.startTime = this.gameEngine.timer.getTime();
        this.done = false;
    }

    allActiveEnemiesDead() {
        return this.activeEnemies.size == 0;
    }

    allEnemiesDead() {
        console.log(this.enemies.length);
        return this.enemies.length == this.defeatedEnemies.size;
    }

    updateStep() {
        for (const e of this.enemies) {
            if (e.defeated && !this.defeatedEnemies.has(e)) {
                this.defeatedEnemies.add(e);
            }
            else if (!e.defeated && !this.activeEnemies.has(e)) {
                this.activeEnemies.add(e);
            }
        }
        if(this.allEnemiesDead() && !this.done){
            this.trigger.onBattleEnd(this);
            this.done = true;
        }
    }

    spawnEnemy(enemy) {
        this.entitySystem.register(enemy);
        enemy.setMeshAndAddToScene({}, this.gameEngine);
        enemy.addToGameEngine(this.gameEngine);
        enemy.addToWorld(this.gameEngine);
        for (const go of enemy.gameObjects) {
            go.scene = this.scene;
            go.addToScene(this.gameEngine)
        }
    }

    destroy(){
        for(const e of this.enemies){
            e.destroy();
        }
        super.destroy();
        this.trigger = null;
        this.players = null;
        this.enemies = null;
        this.activeEnemies = null;
        this.defeatedEnemies = null;
    }
}


export default BattleManager;