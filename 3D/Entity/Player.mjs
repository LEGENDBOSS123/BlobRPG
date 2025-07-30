import Health from "../Components/Health.mjs";
import Composite from "../Physics/Shapes/Composite.mjs";
import Sphere from "../Physics/Shapes/Sphere.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";
import Box from "../Physics/Shapes/Box.mjs";
import DistanceConstraint from "../Physics/Collision/DistanceConstraint.mjs";
import Slime from "./Slime.mjs";
import TextParticle from "../Graphics/Particle/TextParticle.mjs";
import ItemMeshManager from "../Item/ItemMeshManager.mjs";
import GameObject from "../GameObject.mjs";
import HealthEntity from "./HealthEntity.mjs";
import Entity from "./Entity.mjs";
import Inventory from "../Components/Inventory.mjs";
import ProgressBar from "../Web/ProgressBar/ProgressBar.mjs";
import Experience from "../Components/Experience.mjs";
import Enemy from "./Enemy.mjs";
import InventoryUI from "../Web/Inventory/InventoryUI.mjs";
import Counter from "../Web/Counter/Counter.mjs";


// var Player = class extends HealthEntity {
//     constructor(options) {
//         super(options);
//         this.isPlayer = true;
//         this.health = new Health({
//             options,
//             parent: this,
//             onDamage: this.onDamage.bind(this),
//             onDefeat: this.onDefeat.bind(this)
//         });

//         this.gravity = options?.gravity ?? new Vector3(0, 0, 0);
//         this.moveSpeed = options?.moveSpeed ?? 1;
//         this.moveStrength = options?.moveStrength ?? 1;
//         this.airMoveStrength = options?.airMoveStrength ?? 0.1;
//         this.jumpSpeed = options?.jumpSpeed ?? 1;
//         this.radius = options?.radius ?? 1;
//         this.inBattle = false;

//         this.cash = options?.cash ?? 100000;
//         this.hotbar = options?.hotbar ?? Array(9).fill(null);
//         this.hotbarElement = options?.hotbarElement ?? null;
//         this.inventory = options?.hotbar ?? Array(9).fill(null);
//         this.inventoryElement = options?.hotbarElement ?? null;

//         this.tiltable = false;options?.tiltable ?? true;

//         this.totalMass = options?.mass ?? 1;
//         this.height = options?.height ?? 3;

//         this.damage = 1;

//         this.canJump = false;
//         this.touchingGround = false;
//         this.groundVelocity = new Vector3();
//         this.touchingWall = false;
//         this.wallNormal = new Vector3();

//         this.groundDetectDot = 0.8;
//         this.wallDetectDot = 0.2;

//         this.latestItemId = 0;

//         this.experiencePoints = 0;
//         this.level = 1;
//         this.experiencePointsToLevelUp = 100;


//         this.keysHeld = {};
//         this.justToggled = {};
//         this.keysVector = new Vector3();

//         this.composite = new Composite({
//             global: {
//                 body: {
//                     position: options?.position ?? new Vector3(0, 0, 0),
//                     acceleration: this.gravity,
//                     angularDamping: 1
//                 }
//             },
//             local: {
//                 body: {
//                     mass: 0
//                 }
//             }
//         });
//         this.gameObjects.push(
//             new GameObject({
//                 physics: this.composite,
//             })
//         );


//         this.spheres = new Array(this.height);
//         for (var i = 0; i < this.height; i++) {
//             const go = new GameObject();
//             this.spheres[i] = new Sphere({
//                 radius: this.radius,
//                 local: {
//                     body: {
//                         position: new Vector3(0, i * this.radius, 0),
//                         mass: this.totalMass / this.height
//                     }
//                 }
//             });
//             this.composite.add(this.spheres[i]);
//             this.spheres[i].collisionMask = this.spheres[i].setBitMask(0, "P", true);

//             go.physics = this.spheres[i];
//             this.gameObjects.push(go);
//         }

//         this.mainGameObject = this.gameObjects.at(-1);
//         this.spawnPoint = this.spheres[0].global.body.position.copy();


//         this.composite.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);
//         this.composite.syncAll();
//         this.composite.setRestitution(0);
//         this.composite.setFriction(0);
//         for (const sphere of this.spheres) {
//             sphere.setRestitution(0);
//             sphere.setFriction(0);
//         }



//         this.itemHeldBox = new Box({
//             width: 1,
//             height: 1,
//             depth: 1,
//             global: {
//                 body: {
//                     position: options?.position ?? new Vector3(0, 0, 0),
//                     acceleration: this.gravity,
//                 }
//             },
//             local: {
//                 body: {
//                     mass: 0.0000001
//                 }
//             },
//             isSensor: true
//         });
//         this.selectedItemClass = null;
//         this.itemHeldBox.setFriction(1);
//         this.itemHeldBox.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);
//         this.itemHeldConstraint = new DistanceConstraint({
//             body1: this.composite,
//             body2: this.itemHeldBox,
//             anchor1: new Vector3(0, 1, 0),
//             anchor2: new Vector3(0, 0, 0),
//             restLength: 1
//         });

//         this.boxGameObject = new GameObject();
//         this.constraintGameObject = new GameObject();
//         this.boxGameObject.physics = this.itemHeldBox;
//         this.constraintGameObject.physics = this.itemHeldConstraint;

//         this.gameObjects.push(this.boxGameObject);
//         this.gameObjects.push(this.constraintGameObject);

//         this.itemHeldPostCollision = function (contact) {
//             var other = null;
//             var side = 1;
//             if (contact.body1 == this.itemHeldBox) {
//                 other = contact.body2.maxParent;
//                 side = -1;
//             }
//             else {
//                 other = contact.body1.maxParent;
//             }
//             const otherEntity = this.gameEngine.entitySystem.getEntityFromShape(other);
//             if (otherEntity instanceof Slime) {
//                 var alreadyDead = otherEntity.health <= 0;
//                 otherEntity.takeDamage(this.damage);
//                 if (!otherEntity.health.isAlive() && !alreadyDead) {
//                     this.killed(otherEntity);
//                 }
//                 var scale = 1;
//                 const correctNormal = contact.normal.scale(side);
//                 otherEntity.getMainShape().physics.applyForce(correctNormal.scale(this.composite.toTrueVelocity(contact.velocity).dot(correctNormal) * -0.1 * scale), contact.position);
//             }
//         }.bind(this);

//         this.jumpPostCollision = function (contact) {
//             if (contact.ignore || contact.normalImpulse == 0) {
//                 return;
//             }
//             if (contact.body1.maxParent == this.composite) {
//                 if (contact.normal.dot(new Vector3(0, 1, 0)) > this.groundDetectDot) {
//                     this.canJump = true;
//                     if (contact.body2.isImmovable()) {
//                         this.touchingGround = true;

//                         this.groundVelocity = this.composite.toTrueVelocity(contact.velocity);
//                     }
//                 }
//                 if (Math.abs(contact.normal.dot(new Vector3(0, 1, 0))) < this.wallDetectDot) {
//                     this.touchingWall = true;
//                     this.wallNormal = contact.normal.copy();
//                 }
//             }
//             else {
//                 if (contact.normal.dot(new Vector3(0, -1, 0)) > this.groundDetectDot) {
//                     this.canJump = true;
//                     if (contact.body1.isImmovable()) {
//                         this.touchingGround = true;
//                         this.groundVelocity = this.composite.toTrueVelocity(contact.velocity).scale(-1);
//                     }
//                 }
//                 if (Math.abs(contact.normal.dot(new Vector3(0, -1, 0))) < this.wallDetectDot) {
//                     this.touchingWall = true;
//                     this.wallNormal = contact.normal.copy();
//                 }
//             }
//         }.bind(this);

//         this.postStepCallback = function () {
//             var vel = this.composite.global.body.getVelocity();
//             var velXZ = new Vector3(vel.x, 0, vel.z);
//             var velXZ2 = this.groundVelocity;

//             if (velXZ.magnitudeSquared() < 0.0001) {
//                 return;
//             }
//             if (this.touchingGround && this.tiltable) {
//                 velXZ = velXZ2;
//             }
//         }.bind(this);


//         this.preStepCallback = function () {
//             if (!this.spheres[0].sleeping) {
//                 this.touchingGround = false;
//                 this.touchingWall = false;
//             }
//         }.bind(this);

//         this.spheres[0].addEventListener("collision", this.jumpPostCollision);
//         this.spheres[0].addEventListener("preStep", this.preStepCallback);

//         this.composite.addEventListener("postStep", this.postStepCallback);

//         this.itemHeldBox.addEventListener("collision", this.itemHeldPostCollision);

//         this.updateShapeID(this.composite);

//     }

//     setGameEngine(gameEngine) {
//         super.setGameEngine(gameEngine);
//         this.health.setGameEngine(gameEngine);
//     }

//     onDamage(damage) {
//         this.gameEngine.particleSystem.addParticle(new TextParticle({
//             position: this.getMainShape().physics.global.body.position.add(new Vector3(0, 1, 0)),
//             text: "-" + damage,
//             velocity: new Vector3(0, 0.001, 0),
//             duration: 2000,
//             size: 2,
//             fadeInSpeed: 0.1,
//             fadeOutSpeed: 0.1,
//             swayStrength: 0.1,
//             shrinkSpeed: 0.2,
//             growthSpeed: 0.2,
//             canvasWidth: 512,
//             color: "red"
//         }));
//     }

//     onDefeat(damage) {

//     }

//     takeDamage(damage) {
//         this.health.takeDamage(damage);
//     }

//     updateExperiencePoints(x) {
//         this.experiencePoints = x;
//         this.level = Math.floor(Math.sqrt(x));
//         this.experiencePointsToLevelUp = (this.level + 1) * (this.level + 1) - x;
//     }

//     gainedExperiencePoints(x) {
//         const oldLevel = this.level;
//         this.updateExperiencePoints(this.experiencePoints + x);
//         if (this.level > oldLevel) {
//             this.gameEngine.particleSystem.addParticle(new TextParticle({
//                 position: this.getMainShape().physics.global.body.position.add(new Vector3(0, 1, 0)),
//                 text: "+1 LEVEL",
//                 velocity: new Vector3(0, 0.001, 0),
//                 duration: 2000,
//                 size: 2,
//                 fadeInSpeed: 0.1,
//                 fadeOutSpeed: 0.1,
//                 swayStrength: 0.1,
//                 shrinkSpeed: 0.2,
//                 growthSpeed: 0.2,
//                 canvasWidth: 512,
//                 color: "green"
//             }));
//         }
//     }

//     killed(enemy) {
//         console.log("FR");
//         this.gainedExperiencePoints(enemy.experiencePointsValue);
//         this.cash += enemy.cashValue;
//     }



//     setStartPoint(v, override = false) {
//         var startPoint = localStorage["playerStartPoint"];
//         if (!startPoint || override) {
//             localStorage["playerStartPoint"] = JSON.stringify(v.toJSON());
//         }
//         else {
//             v = Vector3.from(JSON.parse(startPoint));
//         }

//         this.spawnPoint = v.copy();
//     }

//     setSpawnPoint(v) {
//         this.spawnPoint = v.copy();
//         localStorage["playerStartPoint"] = JSON.stringify(v.toJSON());
//     }

//     addToScene(gameEngine) {
//         for (var i of this.gameObjects) {
//             i.addMeshToScene(gameEngine);
//         }
//     }

//     addToWorld(gameEngine) {
//         for (var go of this.gameObjects) {
//             go.addToWorld(gameEngine);
//         }
//         this.updateShapeID();
//     }

//     setMeshAndAddToScene(options, gameEngine) {
//         for (var i of this.gameObjects) {
//             i.mesh = i.physics.createMesh({}, gameEngine);
//         }
//         this.constraintGameObject.mesh.mesh.visible = false;
//         this.boxGameObject.mesh.mesh.visible = false;

//         this.addToScene(gameEngine);


//     }

//     wasKeyJustPressed(key) {
//         return !!(this.keysHeld[key] && this.justToggled[key]);
//     }

//     wasKeyJustReleased(key) {
//         return !!(!this.keysHeld[key] && this.justToggled[key]);
//     }

//     isKeyHeld(key) {
//         return !!this.keysHeld[key];
//     }

//     getKeysVector() {
//         return this.keysVector.copy();
//     }

//     updateKeys() {
//         this.keysHeld = structuredClone(this.gameEngine.cameraControls.movement);
//         this.justToggled = structuredClone(this.gameEngine.cameraControls.justToggled);
//         this.keysVector = this.gameEngine.cameraControls.getDelta(this.gameEngine.graphicsEngine.camera).copy();
//     }

//     getSelectedItem() {
//         if (!this.hotbarElement || !(this.hotbarElement.selectedSlot != null)) {
//             return null;
//         }
//         const itemSlot = this.hotbarElement.slots[0][this.hotbarElement.selectedSlot];
//         if (!itemSlot || !itemSlot.item) {
//             return null;
//         }

//         const inventoryItem = itemSlot.item;
//         const item = inventoryItem.item;

//         return item;
//     }

//     useSelectedItem() {
//         if (!this.hotbarElement || !(this.hotbarElement.selectedSlot != null)) {
//             return null;
//         }
//         const itemSlot = this.hotbarElement.slots[0][this.hotbarElement.selectedSlot];
//         if (!itemSlot || !itemSlot.item) {
//             return null;
//         }

//         const inventoryItem = itemSlot.item;
//         const item = inventoryItem.item;

//         switch (item.name) {
//             case "Apple":
//                 this.health += item.heal;
//                 itemSlot.removeNumber(1);
//                 break;
//         }

//     }

//     updateStep() {

//         var selectedItem = this.getSelectedItem();
//         if (selectedItem) {
//             if (selectedItem.type.has("weapon")) {
//                 this.itemHeldBox.height = selectedItem.length;
//                 this.itemHeldBox.width = selectedItem.width;
//                 this.itemHeldBox.depth = selectedItem.width;
//                 this.damage = selectedItem.damage;
//                 this.itemHeldBox.dimensionsChanged();
//                 this.itemHeldConstraint.anchor2 = new Vector3(0, -selectedItem.length / 2, 0);
//                 this.constraintGameObject.mesh.mesh.visible = true;
//                 if (this.itemHeldBox.id == -1) {
//                     this.boxGameObject.addToWorld(this.gameEngine);
//                     this.constraintGameObject.addToWorld(this.gameEngine);
//                     this.itemHeldBox.global.body.setPosition(this.composite.global.body.position.copy());
//                 }

//                 if (this.selectedItemClass != selectedItem.constructor) {
//                     this.selectedItemClass = selectedItem.constructor;

//                     this.latestItemId++;
//                     const latestId = this.latestItemId;

//                     if (ItemMeshManager.has(selectedItem.constructor)) {
//                         if (this.boxGameObject.mesh?.mesh?.parent) {
//                             this.boxGameObject.mesh.mesh.removeFromParent();
//                             this.constraintGameObject.mesh.mesh.removeFromParent();
//                         }
//                         this.boxGameObject.mesh.mesh = ItemMeshManager.get(selectedItem.constructor, this.gameEngine);
//                         this.boxGameObject.addToScene(this.gameEngine);
//                         this.constraintGameObject.addToScene(this.gameEngine);
//                         this.boxGameObject.addMeshToScene(this.gameEngine);
//                         this.constraintGameObject.addMeshToScene(this.gameEngine);
//                         this.boxGameObject.addToWorld(this.gameEngine);
//                         this.constraintGameObject.addToWorld(this.gameEngine);
//                         this.latestId++;
//                     }
//                     else {
//                         ItemMeshManager.loadItem(selectedItem.constructor, this.gameEngine).then(function (mesh) {
//                             if (this.latestItemId == latestId) {
//                                 if (this.boxGameObject.mesh?.mesh?.parent) {
//                                     this.boxGameObject.mesh.mesh.removeFromParent();
//                                     this.constraintGameObject.mesh.mesh.removeFromParent();
//                                 }
//                                 this.boxGameObject.mesh.mesh = mesh;
//                                 this.boxGameObject.addToScene(this.gameEngine);
//                                 this.constraintGameObject.addToScene(this.gameEngine);
//                                 this.boxGameObject.addMeshToScene(this.gameEngine);
//                                 this.constraintGameObject.addMeshToScene(this.gameEngine);
//                                 this.latestId++;
//                             }
//                         }.bind(this));
//                     }
//                 }
//             }
//             else {
//                 if (this.itemHeldBox.id != -1) {
//                     this.gameEngine.world.removeComposite(this.itemHeldBox);
//                     this.gameEngine.world.removeConstraint(this.itemHeldConstraint);
//                     if (this.boxGameObject.mesh?.mesh?.parent) {
//                         this.boxGameObject.mesh.mesh.removeFromParent();
//                         this.constraintGameObject.mesh.mesh.removeFromParent();
//                     }
//                     this.latestItemId++;
//                     this.selectedItemClass = null;
//                 }
//             }
//         }
//         else {
//             if (this.itemHeldBox.id != -1) {
//                 this.gameEngine.world.removeComposite(this.itemHeldBox);
//                 this.gameEngine.world.removeConstraint(this.itemHeldConstraint);
//                 if (this.boxGameObject.mesh?.mesh?.parent) {
//                     this.boxGameObject.mesh.mesh.parent.remove(this.boxGameObject.mesh.mesh);
//                     this.constraintGameObject.mesh.mesh.parent.remove(this.constraintGameObject.mesh.mesh);
//                 }
//                 this.latestItemId++;
//                 this.selectedItemClass = null;
//             }
//         }


// var vel = this.composite.getTrueVelocity();
// var velHorizontal = vel.copy();
// velHorizontal.y = 0;

// var vec = this.getKeysVector();
// var vecHorizontal = vec.copy();
// vecHorizontal.y = 0;
// vecHorizontal.normalizeInPlace();


// var desiredVelocity = vecHorizontal.scale(this.moveSpeed);
// if (this.touchingGround) {
//     var groundVel = this.groundVelocity.copy();
//     groundVel.y = 0;
//     desiredVelocity.subtractInPlace(groundVel.subtract(velHorizontal));
// }
// var velDelta = desiredVelocity.subtract(velHorizontal);
// var mag = velDelta.magnitude();

// var moveStrength = this.moveStrength;

// if (!this.touchingGround) {
//     moveStrength = this.airMoveStrength;
// }

// if (mag > this.moveSpeed * moveStrength) {
//     velDelta.scaleInPlace(this.moveSpeed * moveStrength / mag);
// }
// if (this.isKeyHeld("up") && this.canJump) {
//     velDelta.y = this.jumpSpeed;
//     this.canJump = false;
// }
// this.composite.setTrueVelocity(this.composite.getTrueVelocity().add(velDelta));
//     }

//     respawn() {
//         this.composite.global.body.setPosition(this.spawnPoint.copy());
//         this.composite.global.body.setVelocity(new Vector3(0, 0, 0));
//         this.composite.global.body.angularVelocity.reset();
//         this.composite.global.body.rotation.reset();
//         this.composite.global.body.netForce.reset();
//         this.composite.global.body.netTorque.reset();
//         this.canJump = false;
//         this.touchingWall = false;
//         this.touchingGround = false;
//         this.composite.syncAll();
//     }

//     toJSON() {
//         var json = super.toJSON();
//         json.spheres = this.spheres.map(function (sphere) {
//             return sphere.id;
//         });
//         json.composite = this.composite.id;
//         json.moveSpeed = this.moveSpeed;
//         json.moveStrength = this.moveStrength;
//         json.jumpSpeed = this.jumpSpeed;
//         json.spawnPoint = this.spawnPoint.toJSON();
//         json.canJump = this.canJump;
//         json.touchingWall = this.touchingWall;
//         json.touchingGround = this.touchingGround
//         return json;
//     }

//     static fromJSON(json, world) {
//         var player = super.fromJSON(json, world);
//         player.moveSpeed = json.moveSpeed;
//         player.moveStrength = json.moveStrength;
//         player.jumpSpeed = json.jumpSpeed;
//         player.spawnPoint = Vector3.fromJSON(json.spawnPoint);
//         player.composite = json.composite;
//         player.spheres = json.spheres
//         player.canJump = json.canJump;
//         player.touchingGround = json.touchingGround;
//         player.touchingWall = json.touchingWall;
//         return player;
//     }

//     updateReferences() {
//         super.updateReferences(gameEngine);
//         this.composite = this.gameEngine.world.getByID(this.composite);
//         this.sphere = this.spheres.map(function (sphere) {
//             return this.gameEngine.world.getByID(sphere);
//         });
//         this.spheres[0].addEventListener("collision", this.jumpPostCollision);
//         this.composite.addEventListener("postStep", this.postStepCallback);
//         this.spheres[0].addEventListener("preStep", this.preStepCallback);
//     }

//     getMainShape() {
//         return this.mainGameObject;
//     }

//     destroy() {
//         this.health.destroy();
//         super.destroy();
//     }
// }

// export default Player;



class Player extends Entity {

    static groundDetectDot = 0.8;

    constructor(options) {
        super(options);
        this.isPlayer = true;
        this.health = new Health({
            maxHealth: options?.maxHealth ?? 100,
            parent: this
        });
        this.cash = 0;

        this.damage = 0;
        this.selectedItemClass = null;
        this.latestItemId = 0;

        this.moveSpeed = options?.moveSpeed ?? 1;
        this.moveStrength = options?.moveStrength ?? 1;
        this.airMoveStrength = options?.airMoveStrength ?? 0.1;
        this.jumpSpeed = options?.jumpSpeed ?? 1;

        this.canJump = false;
        this.touchingGround = false;

        this.radius = options?.radius ?? 1;
        this.height = options?.height ?? 3;
        this.totalMass = options?.mass ?? 1;

        this.spawnPoint = options?.spawnPoint ?? new Vector3(0, 0, 0);

        this.composite = null;
        this.spheres = [];
        this.mainGameObject = null;
        this.itemHeldGameObject = null;
        this.itemConstraintGameObject = null;
        this.setUpColliders();
        this.setUpColliderEventListeners();
        this.updateShapeID(this.composite);

        this.keysHeld = {};
        this.justToggled = {};
        this.keysVector = new Vector3();

        this.experience = new Experience();

        this.inventory = new Inventory();
        this.hotbar = new Inventory({
            rows: 1,
            columns: 9
        });

        this.inventoryUI = null;


        this.hotbarUI = null;

        this.healthUI = null;

        this.experienceUI = null;

        this.cashUI = null;
    }

    setUpColliders() {
        this.composite = new Composite({
            global: {
                body: {
                    position: this.spawnPoint,
                    acceleration: new Vector3(0, this.gameEngine.gravity, 0),
                    angularDamping: 1
                }
            },
            local: {
                body: {
                    mass: 0
                }
            },
            gameEngine: this.gameEngine
        });
        this.composite.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);
        this.composite.setRestitution(0);
        this.composite.setFriction(0);
        this.mainGameObject = new GameObject({
            gameEngine: this.gameEngine,
            physics: this.composite
        });
        this.gameObjects.push(this.mainGameObject);

        for (let i = 0; i < this.height; i++) {
            const sphere = new Sphere({
                radius: this.radius,
                local: {
                    body: {
                        position: new Vector3(0, i * this.radius, 0),
                        mass: this.totalMass / this.height
                    }
                },
                gameEngine: this.gameEngine
            });
            this.spheres.push(sphere);
            sphere.setRestitution(0);
            sphere.setFriction(0);
            sphere.collisionMask = sphere.setBitMask(0, "P", true);
            this.composite.add(sphere);
            const cgo = new GameObject({
                gameEngine: this.gameEngine,
                physics: sphere
            });
            this.gameObjects.push(cgo);
        }
        this.composite.syncAll();


        const itemHeldBox = new Box({
            gameEngine: this.gameEngine,
            width: 0.5,
            height: 2,
            depth: 0.5,
            global: {
                body: {
                    position: new Vector3(0, 0, 0),
                    acceleration: new Vector3(0, this.gameEngine.gravity, 0),
                }
            },
            local: {
                body: {
                    mass: 0.000001
                }
            },
            isSensor: true
        });
        const constraint = new DistanceConstraint({
            gameEngine: this.gameEngine,
            body1: this.composite,
            body2: itemHeldBox,
            anchor1: new Vector3(0, 1, 0),
            anchor2: new Vector3(0, 1, 0),
            restLength: 1
        });

        this.itemHeldGameObject = new GameObject({
            gameEngine: this.gameEngine,
            physics: itemHeldBox
        });
        this.itemConstraintGameObject = new GameObject({
            gameEngine: this.gameEngine,
            physics: constraint
        });
        this.gameObjects.push(this.itemHeldGameObject);
        this.gameObjects.push(this.itemConstraintGameObject);
        this.itemHeldGameObject.scene = "";
        this.itemConstraintGameObject.scene = "";
    }

    addToDOM() {
        this.inventoryUI = new InventoryUI({
            inventory: this.inventory,
            gameEngine: this.gameEngine,
            title: "Player Inventory"
        });
        this.inventory.inventoryUI = this.inventoryUI;

        this.hotbarUI = new InventoryUI({
            inventory: this.hotbar,
            gameEngine: this.gameEngine,
            title: "",
            closeable: false,
            draggable: false,
            fullscreenable: false,
            resizable: false
        })
        this.hotbar.inventoryUI = this.hotbarUI;



        this.healthUI = new ProgressBar({
            title: "HEALTH"
        });


        this.healthUI.createHTML({
            container: document.body,
            width: 300,
            height: 20,
            color1: "#FA6666",
            color2: "#FC8686"
        })

        this.healthUI.html.style.top = "5px";
        this.healthUI.html.style.right = "15px";


        this.experienceUI = new ProgressBar({
            title: "LEVEL",
            useMinAsLeftText: true
        });


        this.experienceUI.createHTML({
            container: document.body,
            width: 300,
            height: 20,
            color1: "#B16EFF",
            color2: "#BA81FC"
        })

        this.experienceUI.html.style.top = "30px";
        this.experienceUI.html.style.right = "15px";


        this.cashUI = new Counter({
            title: "CASH",
            prefix: ":       $"
        });
        this.cashUI.createHTML({
            container: document.body,
            height: 20
        })

        this.cashUI.html.style.top = "75px";
        this.cashUI.html.style.right = "40px";


        this.inventoryUI.createHTML({
            width: 700,
            height: 300,
            container: document.body,
            overflow: true
        });

        this.hotbarUI.createHTML({
            width: 700,
            height: 83,
            container: document.body,
            gap: "4px"
        });
        this.hotbarUI.modal.html.style.borderRadius = "16px"


        this.hotbarUI.addDOMEventListener("key-down-hotbar", document.body, "keydown",
            function (event) {
                const parsed = parseInt(event.key);
                if (!isNaN(parsed) && parsed != 0) {
                    this.hotbar.select(parsed - 1);
                }
            }.bind(this)
        );
    }

    setUpColliderEventListeners() {
        this.spheres[0].addEventListener("collision", this.jumpCallback.bind(this));
        this.spheres[0].addEventListener("preStep", this.preStepCallback.bind(this));
        this.itemHeldGameObject.physics.addEventListener("collision", this.itemHeldPostCollisionCallback.bind(this));
    }

    jumpCallback(contact) {
        if (contact.ignore || contact.normalImpulse == 0) {
            return;
        }
        const side = contact.body1.maxParent == this.composite ? 1 : -1;
        const other = contact.body1.maxParent == this.composite ? contact.body2 : contact.body1;
        if (contact.normal.dot(new Vector3(0, side, 0)) > this.constructor.groundDetectDot) {
            this.canJump = true;
            if (other.maxParent.isImmovable()) {
                this.touchingGround = true;
                this.groundVelocity = this.composite.toTrueVelocity(contact.velocity).scale(side);
            }
        }
    }

    preStepCallback(contact) {
        if (!this.spheres[0].sleeping) {
            this.touchingGround = false;
        }
    }

    itemHeldPostCollisionCallback(contact) {
        const other = contact.body1.maxParent == this.itemHeldGameObject.physics.maxParent ? contact.body2 : contact.body1;
        const side = contact.body1.maxParent == this.itemHeldGameObject.physics.maxParent ? 1 : -1;

        const otherEntity = this.gameEngine.entitySystem.getEntityFromShape(other);
        if (otherEntity instanceof Enemy) {
            if (otherEntity.isAlive()) {
                otherEntity.takeDamage(this.damage);
                if (!otherEntity.isAlive()) {
                    this.killed(otherEntity);
                }
                const correctNormal = contact.normal.scale(side);
                const shape = otherEntity.getMainShape().physics;
                shape.setTrueVelocity(
                    shape.getTrueVelocity().add(
                        correctNormal.scale(
                            this.composite.toTrueVelocity(contact.velocity).dot(correctNormal) * side * 0.1
                        )
                    )
                );
            }
        }
    }

    takeDamage(damage) {
        this.health.takeDamage(damage);
    }

    setStartPoint(v, override = false) {
        var startPoint = localStorage["playerStartPoint"];
        if (!startPoint || override) {
            localStorage["playerStartPoint"] = JSON.stringify(v.toJSON());
        }
        else {
            v = Vector3.from(JSON.parse(startPoint));
        }

        this.spawnPoint = v.copy();
    }

    setSpawnPoint(v) {
        this.spawnPoint = v.copy();
        localStorage["playerStartPoint"] = JSON.stringify(v.toJSON());
    }

    getMainShape() {
        return this.mainGameObject;
    }

    respawn() {
        this.mainGameObject.physics.global.body.setPosition(this.spawnPoint);
    }

    addToScene(gameEngine) {
        for (const i of this.gameObjects) {
            i.addMeshToScene(gameEngine);
        }
    }

    addToWorld(gameEngine) {
        for (const go of this.gameObjects) {
            go.addToWorld(gameEngine);
        }
        this.updateShapeID();
    }

    setMeshAndAddToScene(options, gameEngine) {
        for (const i of this.gameObjects) {
            i.mesh = i.physics.createMesh({}, gameEngine);
        }

        this.addToScene(gameEngine);
    }

    wasKeyJustPressed(key) {
        return !!(this.keysHeld[key] && this.justToggled[key]);
    }

    wasKeyJustReleased(key) {
        return !!(!this.keysHeld[key] && this.justToggled[key]);
    }

    isKeyHeld(key) {
        return !!this.keysHeld[key];
    }

    getKeysVector() {
        return this.keysVector.copy();
    }

    updateKeys() {
        this.keysHeld = structuredClone(this.gameEngine.cameraControls.movement);
        this.justToggled = structuredClone(this.gameEngine.cameraControls.justToggled);
        this.keysVector = this.gameEngine.cameraControls.getDelta(this.gameEngine.graphicsEngine.camera).copy();
    }

    killed(enemy) {
        this.experience.gain(enemy.experienceValue);
        this.cash += enemy.cashValue;
    }


    update() {
        this.healthUI.value = this.health.health;
        this.healthUI.max = this.health.maxHealth;
        this.healthUI.min = 0;
        this.healthUI.update();
        this.experienceUI.value = this.experience.exactLevel;
        this.experienceUI.max = this.experience.level + 1;
        this.experienceUI.min = this.experience.level;
        this.experienceUI.update();
        this.cashUI.value = this.cash;
        this.cashUI.update();
        if (this.hotbarUI) {
            this.hotbarUI.modal.center();
            this.hotbarUI.modal.html.style.top = `${this.hotbarUI.modal.html.parentElement.clientHeight - this.hotbarUI.modal.html.offsetHeight - 25}px`;
        }
    }

    updateStep() {

        this.updateSword();

        var vel = this.composite.getTrueVelocity();
        var velHorizontal = vel.copy();
        velHorizontal.y = 0;

        var vec = this.getKeysVector();
        var vecHorizontal = vec.copy();
        vecHorizontal.y = 0;
        vecHorizontal.normalizeInPlace();


        var desiredVelocity = vecHorizontal.scale(this.moveSpeed);
        if (this.touchingGround) {
            var groundVel = this.groundVelocity.copy();
            groundVel.y = 0;
            desiredVelocity.subtractInPlace(groundVel.subtract(velHorizontal));
        }
        var velDelta = desiredVelocity.subtract(velHorizontal);
        var mag = velDelta.magnitude();

        var moveStrength = this.moveStrength;

        if (!this.touchingGround) {
            moveStrength = this.airMoveStrength;
        }

        if (mag > this.moveSpeed * moveStrength) {
            velDelta.scaleInPlace(this.moveSpeed * moveStrength / mag);
        }
        if (this.isKeyHeld("up") && this.canJump) {
            velDelta.y = this.jumpSpeed;
            this.canJump = false;
        }
        this.composite.setTrueVelocity(this.composite.getTrueVelocity().add(velDelta));
    }

    updateSword() {
        const selectedItem = this.hotbar.getSelectedItem();
        if (selectedItem) {
            if (selectedItem.type.has("weapon")) {
                if (this.selectedItemClass != selectedItem.constructor) {
                    this.selectedItemClass = selectedItem.constructor;

                    this.itemConstraintGameObject.addToScene(this.gameEngine, this.mainGameObject.scene);
                    this.itemHeldGameObject.addToScene(this.gameEngine, this.mainGameObject.scene);

                    const box = this.itemHeldGameObject.physics;
                    const constraint = this.itemConstraintGameObject.physics;
                    box.width = selectedItem.width;
                    box.height = selectedItem.length;
                    box.depth = selectedItem.width;
                    box.dimensionsChanged();
                    this.damage = selectedItem.damage;

                    constraint.anchor2 = new Vector3(0, -selectedItem.length / 2, 0);

                    if (box.id == -1) {
                        this.itemConstraintGameObject.addToWorld(this.gameEngine);
                        this.itemHeldGameObject.addToWorld(this.gameEngine);
                        console.log("FR");
                        box.global.body.setPosition(this.composite.global.body.position.copy());
                    }

                    this.latestItemId++;
                    const latestId = this.latestItemId;

                    if (ItemMeshManager.has(selectedItem.constructor)) {
                        this.itemHeldGameObject.disposeMesh();
                        this.itemHeldGameObject.mesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(ItemMeshManager.get(selectedItem.constructor, this.gameEngine));
                        this.itemHeldGameObject.addToScene(this.gameEngine);
                        this.itemHeldGameObject.addMeshToScene(this.gameEngine);
                        this.itemConstraintGameObject.addToScene(this.gameEngine);
                        this.itemConstraintGameObject.addMeshToScene(this.gameEngine);
                    }
                    else {
                        ItemMeshManager.loadItem(selectedItem.constructor, this.gameEngine).then(function (mesh) {
                            if (latestId == this.latestItemId) {
                                this.itemHeldGameObject.disposeMesh();
                                this.itemHeldGameObject.mesh = this.gameEngine.graphicsEngine.meshLinker.createMeshData(mesh);
                                this.itemHeldGameObject.addToScene(this.gameEngine);
                                this.itemHeldGameObject.addMeshToScene(this.gameEngine);
                                this.itemConstraintGameObject.addToScene(this.gameEngine);
                                this.itemConstraintGameObject.addMeshToScene(this.gameEngine);
                            }
                        }.bind(this));

                    }
                }
            }
            else {
                if (this.itemHeldGameObject.physics.id != -1) {
                    this.despawnHeldItem();
                }
                this.selectedItemClass = null;
            }
        }
        else {
            if (this.itemHeldGameObject.physics.id != -1) {
                this.despawnHeldItem();
            }
            this.selectedItemClass = null;
        }
    }

    spawnHeldItem() {
        this.itemConstraintGameObject.addToScene(this.gameEngine, this.mainGameObject.scene);
        this.itemHeldGameObject.addToScene(this.gameEngine, this.mainGameObject.scene);
        this.itemConstraintGameObject.addMeshToScene(this.gameEngine);
        this.itemHeldGameObject.addMeshToScene(this.gameEngine);

    }

    despawnHeldItem() {
        this.itemConstraintGameObject.addToScene(this.gameEngine, "");
        this.itemHeldGameObject.addToScene(this.gameEngine, "");
        this.itemConstraintGameObject.addMeshToScene(this.gameEngine);
        this.itemHeldGameObject.addMeshToScene(this.gameEngine);
        this.gameEngine.world.removeComposite(this.itemHeldGameObject.physics);
        this.gameEngine.world.removeConstraint(this.itemConstraintGameObject.physics);
    }
}

export default Player;