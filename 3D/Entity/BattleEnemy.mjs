import Entity from "./Entity.mjs";

class BattleEnemy extends Entity {

    static AFTER_TIME = 0;
    static AFTER_DEATH = 1;
    static AFTER_ALL_ALIVE_DEAD = 2;

    constructor(options) {
        super(options);
        this.enemy = options?.enemy ?? null;
        this.after = options?.after ?? this.constructor.AFTER_TIME;
        this.afterValue = options?.afterValue ?? 0;
        this.battleManager = options?.battleManager ?? null;
        this.hasSpawned = false;
        this.defeated = false;
    }

    spawn() {
        this.hasSpawned = true;
        this.battleManager.spawnEnemy(this.enemy);
    }

    updateStep() {
        if (!this.hasSpawned) {
            if (this.after == this.constructor.AFTER_DEATH) {
                const enemies = this.afterValue;
                let done = true;
                for (var en of enemies) {
                    if (!en.defeated) {
                        done = false;
                        break;
                    }
                }
                if (done) {
                    this.spawn();
                }
            }
            else if(this.after == this.constructor.AFTER_ALL_ALIVE_DEAD){
                if(this.battleManager.allActiveEnemiesDead()){
                    this.spawn();
                }
            }
            else if (this.after == this.constructor.AFTER_TIME) {
                const duration = this.afterValue;
                const currentTime = this.gameEngine.timer.getTime();
                const startTime = this.battleManager.startTime;
                if (currentTime - startTime > duration) {
                    this.spawn();
                }
            }
        }

        this.defeated = !this.enemy.isAlive();
    }

    destroy(){
        this.enemy.destroy();
        super.destroy();
        this.battleManager = null;
    }
}

export default BattleEnemy;