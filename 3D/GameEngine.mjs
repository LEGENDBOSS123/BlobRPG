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

const GameEngine = class {
    constructor(options) {
        this.entitySystem = new EntitySystem(options?.graphicsEngine);
        this.graphicsEngine = new GraphicsEngine(options?.graphicsEngine);
        this.timer = new Timer(options?.timer);
        this.gameCamera = new CameraTHREEJS(options?.gameCamera);
        this.cameraControls = new SimpleCameraControls(options?.cameraControls);
        this.world = new World(options?.world);
        this.particleSystem = new ParticleSystem(options?.particleSystem);
        this.previousWorld = null;

        this.world.gameEngine = this;
        this.particleSystem.gameEngine = this;
        this.gameCamera.camera = this.graphicsEngine.camera;
        this.cameraControls.camera = this.gameCamera;
        this.particleSystem.timer = this.timer;

        this.fps = options?.fps ?? 20;
        this.fpsStepper = new Timer.Interval(1000 / this.fps);
    }

    stepWorld() {
        this.previousWorld = this.world.toJSON();
        this.world.step();
    }

    updateGameCamera(position) {
        this.gameCamera.update(position, this.graphicsEngine);
    }
    updateGraphicsEngine() {
        this.graphicsEngine.update(this.previousWorld || this.world, this.world, this.fpsStepper.getLerpAmount());
    }
    updateEntitiesStep() {
        this.entitySystem.updateStep(this);
    }
    updateEntities() {
        this.entitySystem.update(this);
    }

    async loadMap(url, entities = {}) {
        const map = { objects: [], meshes: [], entities: [], gltf: null};
        const traverse = function (child, colliderParsed) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.depthWrite = true;
                child.material.side = gameEngine.graphicsEngine.THREE.DoubleSide;
                child.geometry.computeVertexNormals();
                if(child.userData?.invisible){
                    child.visible = false;
                }
                if (!colliderParsed) {
                    var invalidShape = false;
                    var shape = Composite;
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
                                name: child.name
                            }).fromMesh(child, this);
                            map.entities.push(obj);
                        }
                        else {
                            var obj = new shape({
                                name: child.name
                            }).fromMesh(child, this);
                            obj.mesh = this.graphicsEngine.meshLinker.createMeshData(child);
                            obj.mesh.mesh.isPhysicsObject = true;
                            obj.setLocalFlag(Composite.FLAGS.STATIC, true);
                            map.objects.push(obj);
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
            for (const c of child.children) {
                traverse(c, colliderParsed);
            }
        }.bind(this);
        var gltf = await this.graphicsEngine.load(url);
        map.gltf = gltf;
        traverse(gltf.scene);
        return map;
    }
}

export default GameEngine;