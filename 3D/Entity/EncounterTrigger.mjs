import Vector3 from "../Physics/Math3D/Vector3.mjs";
import BattleEnemy from "./BattleEnemy.mjs";
import BattleManager from "./BattleManager.mjs";
import Entity from "./Entity.mjs";
import Player from "./Player.mjs";
import Slime from "./Slime.mjs";

class EncounterTrigger extends Entity {
    static canvasBlinkElement = "canvas-blink";
    constructor(options) {
        super(options);
        this.encounters = ["Slime"];
        this.encounterProbabilities = [1];
        this.encounterChance = 1;
        this.isEncounterTrigger = true;
        this.gameObjects = [];
        this.scene = "dirt_arena";
        this.oldScene = "main";
        this.transitionTime = 300;
        this.enteredPlayers = new Set();

        this.onTriggerEnter = function (contact) {
            const entity1 = this.gameEngine.entitySystem.getEntityFromShape(contact.body1);
            const entity2 = this.gameEngine.entitySystem.getEntityFromShape(contact.body2);
            let player = null;
            if (entity1 instanceof Player) {
                player = entity1;
            } else if (entity2 instanceof Player) {
                player = entity2;
            }
            if (!player) {
                return;
            }

            this.enteredPlayers.add(player);

        }.bind(this);
    }

    getRandomEncounter() {
        let total = 0;
        for (let i = 0; i < this.encounterProbabilities.length; i++) {
            total += this.encounterProbabilities[i];
        }
        let random = Math.random() * total;
        for (let i = 0; i < this.encounterProbabilities.length; i++) {
            random -= this.encounterProbabilities[i];
            if (random <= 0) {
                return this.encounters[i];
            }
        }
    }

    addGameObject(go) {
        this.gameObjects.push(go);
        go.physics.isSensor = true;
        go.physics.addEventListener("collision", this.onTriggerEnter);
    }

    onBattleEnd(battleManager) {
        document.getElementById("canvas-blink").classList.add("black");
        setTimeout(function () {
            document.getElementById("canvas-blink").classList.remove("black");
        }, this.transitionTime);
        setTimeout(function () {
            console.log(battleManager);
            for (const player of battleManager.players) {
                player.inBattle = false;
                for (const go of player.gameObjects) {
                    go.scene = this.oldScene;
                    go.addToScene(this.gameEngine);
                    go.addMeshToScene(this.gameEngine);
                }
            }
            battleManager.destroy();

            this.gameEngine.loadScene(this.oldScene);
        }.bind(this), this.transitionTime * 0.5);
    }

    initiateBattle(players, enemies) {

        for (const p of players) {
            p.inBattle = true;
        }

        const battleManager = new BattleManager({
            players: players,
            trigger: this,
            gameEngine: this.gameEngine
        });

        const battleEnemies = [];
        for (const e of enemies) {
            let enemy = [];
            switch (e) {
                case "Slime":
                    let slime = new Slime({
                        gameEngine: this.gameEngine,
                        gravity: new Vector3(0, this.gameEngine.gravity, 0),
                        position: new Vector3(0, 0, 0),
                        radius: 1,
                        speed: 0.5,
                        jumpPower: 1,
                        gameEngine: this.gameEngine
                    });
                    slime.sphere.setRestitution(1)
                    
                    slime.getTargets = function () {
                        return [players[0].id];
                    }
                    enemy = [slime];
                    break;
            }
            for (const enem of enemy) {
                const be = new BattleEnemy({
                    enemy: enem,
                    battleManager: battleManager,
                    gameEngine: this.gameEngine
                })
                battleEnemies.push(be);
            }
        }

        this.entitySystem.register(battleManager);
        for (const be of battleEnemies) {
            this.entitySystem.register(be);
        }

        battleManager.enemies = battleEnemies;

        document.getElementById("canvas-blink").classList.add("black");
        setTimeout(function () {
            document.getElementById("canvas-blink").classList.remove("black");
        }, this.transitionTime)
        setTimeout(function () {
            for (const player of players) {
                for (const go of player.gameObjects) {
                    go.scene = this.scene;
                    go.addToScene(this.gameEngine);
                    go.addMeshToScene(this.gameEngine);
                }
                player.getMainShape().physics.maxParent.setPosition(new Vector3(0, 2, 0));
                player.getMainShape().physics.maxParent.global.body.setVelocity(new Vector3())
            }
            this.oldScene = this.gameEngine.activeScene;
            this.gameEngine.loadScene(this.scene);
        }.bind(this), this.transitionTime * 0.5);
    }

    updateStep() {
        for (const player of this.enteredPlayers) {
            if (!player.inBattle && Math.random() < this.encounterChance) {
                this.initiateBattle([player], [this.getRandomEncounter()]);
            }
        }

        this.enteredPlayers.clear();
    }

}

export default EncounterTrigger;