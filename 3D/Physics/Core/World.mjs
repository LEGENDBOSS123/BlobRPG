import SpatialHash from "../Broadphase/SpatialHash.mjs";
import SweepAndPrune from "../Broadphase/SweepAndPrune.mjs";
import Octree from "../Broadphase/Octree.mjs";
import CollisionDetector from "../Collision/CollisionDetector.mjs";
import ClassRegistry from "./ClassRegistry.mjs";



const World = class {
    constructor(options) {
        this.maxID = options?.maxID ?? 0;
        this.deltaTime = options?.deltaTime ?? 1;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;

        this.substeps = options?.substeps ?? 1;
        this.stepCount = options?.stepCount ?? 0;
        this.all = options?.all ?? {};
        this.constraints = options?.constraints ?? [];
        this.composites = options?.composites ?? [];
        this.broadphase = options?.broadphase ?? SpatialHash;
        this.spatialHash = options?.spatialHash ?? new this.broadphase({ world: this });
        this.collisionDetector = options?.collisionDetector ?? new CollisionDetector({ world: this });
        this.gameEngine = options?.gameEngine ?? null;
        this.linearSleepThreshold = options?.linearSleepThreshold ?? 0.00000001;
        this.angularSleepThreshold = options?.angularSleepThreshold ?? 0.9999999;
    }

    setDeltaTime(deltaTime) {
        this.deltaTime = deltaTime;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;
    }

    setSubsteps(substeps) {
        this.substeps = substeps;
        this.setDeltaTime(1 / this.substeps);
    }

    setIterations(iterations) {
        this.collisionDetector.iterations = iterations;
    }

    addComposite(composite) {
        if (!this.getByID(composite.id)) {
            this.add(composite);
            this.composites.push(composite);
        }

        for (const child of composite.children) {
            this.addComposite(child);
        }
    }

    addConstraint(element) {
        if(this.getByID(element.id)) {
            return;
        }
        this.add(element);
        this.constraints.push(element);
    }

    add(element) {
        element.id = (this.maxID++);
        element.gameEngine = this.gameEngine;
        element.mesh = element._mesh;
        element._mesh = null;
        this.all[element.id] = element;
        return element;
    }

    removeComposite(element, first = true) {

        if (element.parent && first) {
            element.parent.children.splice(element.parent.children.indexOf(element), 1);
        }

        for (const child of element.children) {
            this.removeComposite(child, false);
        }
        this.composites.splice(this.composites.indexOf(element), 1);

        this.remove(element);
    }

    removeConstraint(element) {
        this.constraints.splice(this.constraints.indexOf(element), 1);
        this.remove(element);
    }


    remove(element) {
        element.dispatchEvent("delete");
        element._mesh = element.mesh;
        this.gameEngine.graphicsEngine.meshLinker.removeMesh(element.id);
        this.spatialHash.remove(element.id);
        delete this.all[element.id];
        element.id = -1;
    }

    step() {
        for (const i in this.all) {
            this.all[i].dispatchEvent("preStep");
        }
        for (var iter = 0; iter < this.substeps; iter++) {
            for (const comp of this.composites) {
                if (comp.isMaxParent()) {
                    comp.syncAll();
                    comp.updateSleepAll();
                }
                if (comp.sleeping) {
                    continue;
                }
                if (comp.isMaxParent()) {
                    comp.updateBeforeCollisionAll();
                }
            }
            
            this.collisionDetector.handleAll(this.composites);
            this.collisionDetector.resolveAll();
            
            for (const comp of this.composites) {
                if (comp.isMaxParent()) {
                    comp.updateAfterCollisionAll();
                }
                comp.dispatchEvent("postSubstep");
            }
        }

        for (const comp of this.composites) {
            comp.dispatchEvent("postStep");
        }

        for (const comp of this.composites) {
            if (comp.toBeRemoved) {
                this.removeComposite(comp);
            }
        }
        for (const cons of this.constraints) {
            if (cons.toBeRemoved) {
                this.removeConstraint(cons);
            }
        }
        this.stepCount++;
    }

    getByID(id) {
        return this.all[id];
    }

    toJSON() {
        const world = {};

        world.maxID = this.maxID;
        world.deltaTime = this.deltaTime;
        world.deltaTimeSquared = this.deltaTimeSquared;
        world.inverseDeltaTime = this.inverseDeltaTime;
        world.substeps = this.substeps;
        world.stepCount = this.stepCount;
        world.all = {};
        world.composites = [];
        world.constraints = [];

        for (const i in this.all) {
            world.all[i] = this.getByID(i).toJSON();
        }

        for (const i in this.composites) {
            world.composites[i] = this.composites[i].id;
        }

        for (const i in this.constraints) {
            world.constraints[i] = this.constraints[i].id;
        }

        world.spatialHash = null;
        world.collisionDetector = this.collisionDetector.toJSON();

        return world;
    }

    static fromJSON(json, gameEngine = this.gameEngine) {
        const world = new this();

        world.maxID = json.maxID;
        world.deltaTime = json.deltaTime;
        world.deltaTimeSquared = json.deltaTimeSquared;
        world.inverseDeltaTime = json.inverseDeltaTime;
        world.substeps = json.substeps;
        world.stepCount = json.stepCount;
        world.all = {};

        for (var i in json.all) {
            world.all[i] = ClassRegistry.getClassFromType(json.all[i].type).fromJSON(json.all[i], gameEngine);
        }

        for (var i in world.all) {
            world.all[i].updateReferences(gameEngine);
        }

        for (var i in json.constraints) {
            world.constraints[i] = world.getByID(json.constraints[i]);
        }

        for (var i in json.composites) {
            world.composites[i] = world.getByID(json.composites[i]);
        }

        world.spatialHash = new this.broadphase({ world: world });
        world.collisionDetector = CollisionDetector.fromJSON(json.collisionDetector, world);
        world.gameEngine = gameEngine;
        return world;
    }
};


export default World;