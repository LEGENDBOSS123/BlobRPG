import Vector3 from "../Math3D/Vector3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";

const SpatialHash = class {
    constructor(options) {
        this.world = options?.world ?? null;
        this.spatialHashes = [];
        for (var i = 0; i < (options?.gridSizes?.length ?? 16); i++) {
            var spatialHash = {};
            spatialHash.hashmap = new Map();
            spatialHash.gridSize = options?.gridSizes?.[i] ?? Math.pow(2, i) * 0.25;
            spatialHash.inverseGridSize = 1 / spatialHash.gridSize;
            spatialHash.threshold = options?.thresholds?.[i] ?? 2;
            spatialHash.translation = new Vector3();
            spatialHash.index = i;
            if (spatialHash.index % 2 == 0) {
                spatialHash.translation = new Vector3(spatialHash.gridSize * 0.5, spatialHash.gridSize * 0.5, spatialHash.gridSize * 0.5);
            }

            this.spatialHashes.push(spatialHash);
        }
        for (var i = 0; i < this.spatialHashes.length - 1; i++) {
            this.spatialHashes[i].next = this.spatialHashes[i + 1];
            this.spatialHashes[i].final = false;
        }
        this.global = new Set();
        this.spatialHashes.push({ final: true, hashmap: this.global, next: null, index: this.spatialHashes.length });
        this.spatialHashes[this.spatialHashes.length - 2].next = this.spatialHashes[this.spatialHashes.length - 1];
        this.ids = {};

        this.minCellPosition = new Vector3();
        this.maxCellPosition = new Vector3();
    }

    hash(x, y, z) {
        return (x * 73856093 ^ y * 19349663 ^ z * 83492791) >> 0;
    }

    remove(id) {
        this.removeHitbox(id);
        delete this.ids[id];
    }

    getCellPosition(v, hash, store) {
        store.x = Math.floor((v.x + hash.translation.x) * hash.inverseGridSize);
        store.y = Math.floor((v.y + hash.translation.y) * hash.inverseGridSize);
        store.z = Math.floor((v.z + hash.translation.z) * hash.inverseGridSize);
    }

    getSizeHeuristic(min, max) {
        return (max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1);
    }

    _addHitbox(hitbox, id) {
        var hash = this.spatialHashes[0];
        var below = false;

        while (hash) {
            if (hash.final) {
                hash.hashmap.add(id);
                this.ids[id].hash = hash;
                return true;
            }

            this.getCellPosition(hitbox.min, hash, this.minCellPosition);
            this.getCellPosition(hitbox.max, hash, this.maxCellPosition);
            const min = this.minCellPosition;
            const max = this.maxCellPosition;

            if (!below) {
                if (this.getSizeHeuristic(min, max) > hash.threshold) {
                    hash = hash.next;
                    continue;
                }
                this.ids[id].hash = hash;
            }

            for (var x = min.x; x <= max.x; x++) {
                for (var y = min.y; y <= max.y; y++) {
                    for (var z = min.z; z <= max.z; z++) {
                        const cell = this.hash(x, y, z);
                        this.addToCell(cell, id, hash, below);
                    }
                }
            }

            if (hash.next.final) {
                break;
            }
            hash = hash.next;
            below = true;
        }
    }

    addHitbox(hitbox, id) {
        if (this.ids[id]) {
            if (this.ids[id].hitbox.equals(hitbox)) {
                return;
            }
            this.removeHitbox(id);
        }
        this.ids[id] = {};
        this.ids[id].hitbox = hitbox.copy();
        this._addHitbox(hitbox, id);
    }

    _removeHitbox(hitbox, id, hash) {
        var below = false;
        while (hash) {
            if (hash.final) {
                hash.hashmap.delete(id);
                return true;
            }
            this.getCellPosition(hitbox.min, hash, this.minCellPosition);
            this.getCellPosition(hitbox.max, hash, this.maxCellPosition);
            const min = this.minCellPosition;
            const max = this.maxCellPosition;
            for (var x = min.x; x <= max.x; x++) {
                for (var y = min.y; y <= max.y; y++) {
                    for (var z = min.z; z <= max.z; z++) {
                        const cell = this.hash(x, y, z);
                        this.removeFromCell(cell, id, hash, below);
                    }
                }
            }

            if (hash.next.final) {
                break;
            }
            hash = hash.next;
            below = true;
        }
    }

    removeHitbox(id) {
        if (!this.ids[id]) {
            return;
        }
        this._removeHitbox(this.ids[id].hitbox, id, this.ids[id].hash);
    }

    removeFromCell(cell, id, hash, below = false) {
        const map = hash.hashmap.get(cell);
        if (!map) {
            return false;
        }
        var set = map.array;
        var set2 = map.below;
        if (below) {
            set = map.below;
            set2 = map.array;
        }

        set.delete(id);
        if (set.size == 0 && set2.size == 0) {
            hash.hashmap.delete(cell);
        }
        return true;
    }

    addToCell(cell, id, hash, below = false) {
        var map = hash.hashmap.get(cell);
        if (!map) {
            map = { array: new Set(), below: new Set() };
            hash.hashmap.set(cell, map);
        }
        if (below) {
            map.below.add(id);
            return true;
        }
        map.array.add(id);
        return true;
    }

    _query(hitbox, func, hash) {
        var first = true;
        while (hash) {
            if (hash.final) {
                for (var i of hash.hashmap) {
                    func(i);
                }
                if (first) {
                    for (var i in this.ids) {
                        func(i);
                    }
                }
                return;
            }
            this.getCellPosition(hitbox.min, hash, this.minCellPosition);
            this.getCellPosition(hitbox.max, hash, this.maxCellPosition);
            const min = this.minCellPosition;
            const max = this.maxCellPosition;
            var map = null;
            var cell = null;
            if (hash.hashmap.size > 0) {
                for (var x = min.x; x <= max.x; x++) {
                    for (var y = min.y; y <= max.y; y++) {
                        for (var z = min.z; z <= max.z; z++) {
                            cell = this.hash(x, y, z);
                            map = hash.hashmap.get(cell);
                            if (map) {
                                for (const i of map.array) {
                                    func(i);
                                }
                                if (first) {
                                    for (const i of map.below) {
                                        func(i);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            first = false;
            hash = hash.next;
        }
    }

    query(id, func) {
        if (!this.ids[id]) {
            return;
        }
        if (!func) {
            func = function () {
                return true;
            }
        }
        return this._query(this.ids[id].hitbox, func, this.ids[id].hash);
    }

    toJSON() {
        var spatialHash = {};

        spatialHash.world = this.world.id;
        spatialHash.spatialHashes = [];
        spatialHash.global = new Set(this.global);
        for (var i = 0; i < this.spatialHashes.length; i++) {
            var hash = {};
            hash.gridSize = this.spatialHashes[i].gridSize;
            hash.inverseGridSize = this.spatialHashes[i].inverseGridSize;
            hash.threshold = this.spatialHashes[i].threshold;
            hash.translation = this.spatialHashes[i].translation.toJSON();
            hash.final = this.spatialHashes[i].final;
            hash.index = this.spatialHashes[i].index;
            if (!this.spatialHashes[i].final) {
                hash.next = i + 1;
                hash.hashmap = new Map(this.spatialHashes[i].hashmap);
            }
            else {
                hash.next = null;
                hash.hashmap = spatialHash.global;
            }
            spatialHash.spatialHashes.push(hash);
        }
        spatialHash.ids = {};
        for (var i in this.ids) {
            spatialHash.ids[i] = {};
            spatialHash.ids[i].hitbox = this.ids[i].hitbox.toJSON();
            spatialHash.ids[i].hash = this.ids[i].hash.index;
        }
        return spatialHash;
    }

    static fromJSON(json, world) {
        const spatialHash = new this();
        spatialHash.world = world;
        spatialHash.global = json.global;
        spatialHash.spatialHashes = json.spatialHashes;
        for (const hash of spatialHash.spatialHashes) {
            hash.translation = Vector3.fromJSON(hash.translation);
            if (!hash.final) {
                hash.next = spatialHash.spatialHashes[hash.next];
            }
        }
        spatialHash.ids = json.ids;
        for (const i in spatialHash.ids) {
            spatialHash.ids[i].hitbox = Hitbox3.fromJSON(spatialHash.ids[i].hitbox);
            spatialHash.ids[i].hash = spatialHash.spatialHashes[spatialHash.ids[i].hash];
        }
        return spatialHash;
    }
};


export default SpatialHash;
