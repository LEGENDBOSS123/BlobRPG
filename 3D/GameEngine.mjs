
import CameraTHREEJS from "./CameraTHREEJS.mjs";
import EntitySystem from "./Entity/EntitySystem.mjs";
import GraphicsEngine from "./Graphics/GraphicsEngine.mjs";
import ParticleSystem from "./Graphics/Particle/ParticleSystem.mjs";
import Timer from "./Physics/Core/Timer.mjs";
import World from "./Physics/Core/World.mjs";
import Box from "./Physics/Shapes/Box.mjs";
import Composite from "./Physics/Shapes/Composite.mjs";
import Polyhedron from "./Physics/Shapes/Polyhedron.mjs";
import Sphere from "./Physics/Shapes/Sphere.mjs";
import SimpleCameraControls from "./SimpleCameraControls.mjs";
import SoundManager from "./Sounds/SoundManager.mjs";
import ToastManager from "./Web/Toast/ToastManager.mjs";
import Vector3 from "./Physics/Math3D/Vector3.mjs";
import GameObject from "./GameObject.mjs";
/**
 * @typedef {object} GameEngineOptions
 * @property {object} [graphicsEngine] - Options for the GraphicsEngine.
 * @property {object} [timer] - Options for the Timer.
 * @property {object} [gameCamera] - Options for the CameraTHREEJS.
 * @property {object} [cameraControls] - Options for the SimpleCameraControls.
 * @property {object} [world] - Options for the Physics World.
 * @property {object} [particleSystem] - Options for the ParticleSystem.
 * @property {object} [soundManager] - Options for the SoundManager.
 * @property {object} [toastManager] - Options for the ToastManager.
 * @property {number} [fps=20] - The desired frames per second for game logic updates.
 */


const GameEngine = class {

    static maxID = 0;
    /**
     * @param {GameEngineOptions} options
     */
    constructor(options) {

        this.all = {};
        this.scenes = {};
        this.activeScene = "main";

        this.entitySystem = new EntitySystem(options?.graphicsEngine);
        this.graphicsEngine = new GraphicsEngine(options?.graphicsEngine);
        this.timer = new Timer(options?.timer);
        this.gameCamera = new CameraTHREEJS(options?.gameCamera);
        this.cameraControls = new SimpleCameraControls(options?.cameraControls);
        this.world = new World(options?.world);
        this.particleSystem = new ParticleSystem(options?.particleSystem);
        this.soundManager = new SoundManager(options?.soundManager);
        this.toastManager = new ToastManager(options?.toastManager);
        this.previousWorld = null;

        this.world.gameEngine = this;
        this.particleSystem.gameEngine = this;
        this.soundManager.gameEngine = this;
        this.toastManager.gameEngine = this;
        this.gameCamera.camera = this.graphicsEngine.camera;
        this.cameraControls.camera = this.gameCamera;
        this.graphicsEngine.gameEngine = this;
        this.graphicsEngine.modelPool.gameEngine = this;
        this.entitySystem.gameEngine = this;

        this.fps = options?.fps ?? 20;
        this.fpsStepper = new Timer.Interval(1000 / this.fps);
    }

    addToScene(object, scene = "main") {
        this.graphicsEngine.addToScene(object, scene);
    }

    removeScene(scene) {

    }

    removeAllScenes() {
        this.activeScene = "";
        this.graphicsEngine.swapScene("");
        this.world.removeAllConstraints();
        this.world.removeAllComposites();
    }

    loadScene(sceneName) {
        if (!this.scenes[sceneName]) {
            return;
        }
        this.activeScene = sceneName;
        this.graphicsEngine.swapScene(sceneName);
        for(var i in this.all){
            const gameObject = this.all[i];
            if(gameObject.scene == sceneName){
                gameObject.addToWorld(this);
            }
        }
    }

    addGameObject(gameObject, scene = "main") {
        gameObject.gameEngine = this;
        gameObject.id = GameEngine.maxID++;
        this.all[gameObject.id] = gameObject;
        gameObject.mesh = gameObject._mesh;
        gameObject._mesh = null;

        if (!this.scenes[scene]) {
            this.scenes[scene] = {};
            this.graphicsEngine.createScene(scene);
        }

        this.scenes[scene][gameObject.id] = gameObject;

    }

    getByID(id) {
        return this.all[id] || null;
    }



    /**
     * Steps the physics world
     */
    stepWorld() {
        this.previousWorld = this.world.toJSON();
        this.world.step();
    }

    /**
     * Updates the game camera.
     * @param {Vector3} position 
     */
    updateGameCamera(position) {
        this.gameCamera.update(position, this.graphicsEngine);
    }

    updateGraphicsEngine() {
        this.graphicsEngine.update(this, this.previousWorld || this.world, this.world, this.fpsStepper.getLerpAmount());
    }
    updateEntitiesStep() {
        this.entitySystem.updateStep(this);
    }
    updateEntities() {
        this.entitySystem.update(this);
    }


    /**
     * Loads a map into physics objects, meshes, and entities
     * @param {string} url 
     * @param {Object} entities 
     * @returns 
     */
    async loadMap(url, entities = {}) {
        const map = { objects: [], meshes: [], entities: [], gltf: null };
        const traverse = function (child, colliderParsed) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.depthWrite = true;
                child.material.side = this.graphicsEngine.THREE.DoubleSide;
                child.geometry.computeVertexNormals();
                if (child.userData?.invisible) {
                    child.visible = false;
                }
                if (!colliderParsed) {
                    var invalidShape = false;
                    var shape = Composite
                    var chosen = false;
                    for (var name in entities) {
                        if (child.name.startsWith(name)) {
                            shape = entities[name];
                            chosen = true;
                        }
                    }
                    if (!chosen) {
                        if (child.name.startsWith("Box")) {
                            shape = Box;

                        }
                        else if (child.name.startsWith("Sphere")) {
                            shape = Sphere;
                        }
                        else if (child.name.startsWith("Poly")) {
                            shape = Polyhedron;
                        }
                        else {
                            map.meshes.push(child);
                            invalidShape = true;
                        }
                    }

                    if (!invalidShape) {
                        if (chosen) {
                            var obj = new shape({
                                name: child.name,
                                gameEngine: this,
                            })
                            obj.fromMesh(child, this);
                            map.entities.push(obj);
                        }
                        else {
                            var obj = new shape({
                                name: child.name,
                                gameEngine: this,
                            }).fromMesh(child, this);

                            var mesh = this.graphicsEngine.meshLinker.createMeshData(child);
                            mesh.mesh.isPhysicsObject = true;
                            var go = new GameObject({ physics: obj, mesh: mesh });
                            obj.setLocalFlag(Composite.FLAGS.STATIC, true);
                            obj.setRestitution(0);
                            map.objects.push(go);
                        }
                    }

                    colliderParsed = true;
                }
            }
            else if (child.isLight) {
                child.castShadow = true;
                child.shadow.bias = this.graphicsEngine.shadowBias;
                map.meshes.push(child);
            }
            for (let c = child.children.length - 1; c >= 0; c--) {
                traverse(child.children[c], colliderParsed);
            }
        }.bind(this);
        var gltf = await this.graphicsEngine.load(url);
        map.gltf = gltf;
        traverse(gltf.scene);
        return map;
    }
}

export default GameEngine;