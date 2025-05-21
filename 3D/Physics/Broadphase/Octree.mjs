import Vector3 from "../Math3D/Vector3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";

const OctreeNode = class {
    constructor(boundary, depth = 0, maxDepth = 8, capacity = 4) {
        this.boundary = boundary;
        this.depth = depth;
        this.maxDepth = maxDepth;
        this.capacity = capacity;
        this.objects = [];
        this.children = [];
    }
    subdivide() {
        var min = this.boundary.min;
        var max = this.boundary.max;
        var mid = min.add(max).scaleInPlace(0.5);

        for (let dx = 0; dx < 2; dx++) {
            for (let dy = 0; dy < 2; dy++) {
                for (let dz = 0; dz < 2; dz++) {
                    var childMin = new Vector3(dx == 0 ? min.x : mid.x, dy == 0 ? min.y : mid.y, dz == 0 ? min.z : mid.z);
                    var childMax = new Vector3(dx == 0 ? mid.x : max.x, dy == 0 ? mid.y : max.y, dz == 0 ? mid.z : max.z,);
                    var childBoundary = new Hitbox3(childMin, childMax);
                    this.children.push(
                        new OctreeNode(childBoundary, this.depth + 1, this.maxDepth, this.capacity)
                    );
                }
            }
        }
    }
    insert(object) {
        if (!this.boundary.contains(object.aabb)) return false;
        
        if (this.children.length === 0) {
            this.objects.push(object);
            if (this.objects.length > this.capacity && this.depth < this.maxDepth) {
                this.subdivide();
                var writeIndex = 0;
                for (var i = 0; i < this.objects.length; i++) {
                    var obj = this.objects[i];
                    var inserted = false;
                    for (var child of this.children) {
                        if (child.boundary.contains(obj.aabb)) {
                            child.insert(obj);
                            inserted = true;
                            break;
                        }
                    }
                    if(!inserted){
                        this.objects[writeIndex] = obj;
                        writeIndex++;
                    }
                }
                this.objects.length = writeIndex;
            }
            return true;
        }
        for (var child of this.children) {
            if (child.boundary.contains(object.aabb)) {
                return child.insert(object);
            }
        }
        this.objects.push(object);
        return true;
    }
    query(range, func) {
        if (!this.boundary.intersects(range)){
            return;
        }
        for (var obj of this.objects) {
            if (obj.aabb.intersects(range)){
                func(obj.id);
            }
        }
        for (var child of this.children) {
            child.query(range, func);
        }
    }
    remove(object) {
        var index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
            return true;
        }
        for (var child of this.children) {
            if (child.remove(object)) return true;
        }
        return false;
    }
}


var Octree = class {

    constructor(options) {
        this.world = options?.world ?? null;
        this.ids = {};
        this.root = new OctreeNode(options?.boundary ?? (new Hitbox3()).extend(new Vector3(1,1,1).scale(1000000)), 0, options?.maxDepth ?? 20, options?.capacity ?? 2);
    }

    _insert(object) {
        return this.root.insert(object);
    }
    _query(range, func) {
        return this.root.query(range, func);
    }
    _remove(object) {
        return this.root.remove(object);
    }


    remove(id) {
        this.removeHitbox(id);
        delete this.ids[id];
    }

    removeHitbox(id) {
        this._remove(this.ids[id]);
    }

    addHitbox(hitbox, id) {
        if (this.ids[id]) {
            if (this.ids[id].aabb.equals(hitbox)) {
                return;
            }
            this.removeHitbox(id);
        }
        else {
            this.ids[id] = {};
        }

        this.ids[id].aabb = hitbox.copy();
        this.ids[id].id = id;
        this._insert(this.ids[id]);
    }

    query(id, func) {
        if (!this.ids[id]) {
            return [];
        }
        return this._query(this.ids[id].aabb, func);
    }

    toJSON() {

    }

    static fromJSON(json, world) {

    }
};


export default Octree;