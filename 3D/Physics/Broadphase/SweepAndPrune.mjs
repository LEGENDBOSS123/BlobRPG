import Vector3 from "../Math3D/Vector3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";

const SweepAndPrune = class {

    constructor(options) {
        this.world = options?.world ?? null;
        this.ids = {};
        this.sortedAlongAxis = options?.sortedAlongAxis ?? [];
        this.pairs = [];
    }


    remove(id) {
        delete this.ids[id];
    }


    insertionSort(arr, compare = function(a, b) {return a - b}) {
        for (let i = 1; i < arr.length; i++) {
            let key = arr[i];
            let j = i - 1;

            while (j >= 0 && compare(arr[j], key) > 0) {
                arr[j + 1] = arr[j];
                j--;
            }

            arr[j + 1] = key;
        }
        return arr;
    }

    removeInvalidIDs(arr) {
        var writeIndex = 0;
        for (var readIndex = 0; readIndex < arr.length; readIndex++) {
            if (this.ids[arr[readIndex]]) {
                arr[writeIndex] = arr[readIndex];
                writeIndex++;
            }
        }
        arr.length = writeIndex;
        return arr;
    }


    addHitbox(hitbox, id) {
        if (this.ids[id]) {
            if (this.ids[id].hitbox.equals(hitbox)) {
                return;
            }
        }
        else {
            this.ids[id] = {};
            this.sortedAlongAxis.push(id);
        }

        this.ids[id].hitbox = hitbox.copy();

    }

    findAllPairs(func) {
        //console.log(this);
        this.removeInvalidIDs(this.sortedAlongAxis);
        this.insertionSort(this.sortedAlongAxis, function (a, b) { return this.ids[a].hitbox.min.x - this.ids[b].hitbox.min.x }.bind(this));
        let activeList = [];
        this.pairs = [];

        for (var id of this.sortedAlongAxis) {
            if(id == 1)
            activeList = activeList.filter(other => this.ids[other].hitbox.max.x >= this.ids[id].hitbox.min.x);

            for (let other of activeList) {
                if (this.ids[id].hitbox.intersects(this.ids[other].hitbox)) {
                    if(id != 1 && other != 1){
                        //continue;
                    }
                    func(id, other)
                    this.pairs.push([id, other]);
                }
            }

            activeList.push(id);
        }
        //console.log(pairs);
        return this.pairs;

    }

    toJSON() {

    }

    static fromJSON(json, world) {

    }
};


export default SweepAndPrune;