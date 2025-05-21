import Composite from "./Composite.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";
import Triangle from "./Triangle.mjs";
import ClassRegistry from "../Core/ClassRegistry.mjs";

const Terrain3 = class extends Composite {
    static name = "TERRAIN3";
    constructor(options) {
        super(options);


        this.heightmaps = {};

        this.heightmaps.width = options?.heightmaps?.width ?? 2;
        this.heightmaps.depth = options?.heightmaps?.depth ?? 2;
        this.heightmaps.widthSegments = options?.heightmaps?.widthSegments ?? this.heightmaps.width - 1 ?? 1;
        this.heightmaps.depthSegments = options?.heightmaps?.depthSegments ?? this.heightmaps.depth - 1 ?? 1;

        this.heightmaps.top = {};
        this.heightmaps.top.map = options?.heightmaps?.top?.map ?? new Float32Array(this.heightmaps.width * this.heightmaps.depth);

        this.heightmaps.bottom = {};
        this.heightmaps.bottom.map = options?.heightmaps?.bottom?.map ?? new Float32Array(this.heightmaps.width * this.heightmaps.depth);

        this.terrainScale = options?.terrainScale ?? 1;
        this.inverseTerrainScale = options?.inverseTerrainScale ?? 1 / this.terrainScale;

        this.terrainWidth = options?.terrainWidth ?? this.heightmaps.widthSegments * this.terrainScale;
        this.terrainDepth = options?.terrainDepth ?? this.heightmaps.depthSegments * this.terrainScale;

        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);

        this.dimensionsChanged();
    }

    setDimensions(width, depth) {
        this.heightmaps.width = width;
        this.heightmaps.depth = depth;
        this.heightmaps.widthSegments = this.heightmaps.width - 1;
        this.heightmaps.depthSegments = this.heightmaps.depth - 1;

        this.terrainWidth = this.heightmaps.widthSegments * this.terrainScale;
        this.terrainDepth = this.heightmaps.depthSegments * this.terrainScale;

        this.dimensionsChanged();
        return this;
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        return this.local.body.momentOfInertia;
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    balance() {
        var averageHeight = 0;
        for (var i = 0; i < this.heightmaps.top.map.length; i++) {
            averageHeight += this.heightmaps.top.map[i] + this.heightmaps.bottom.map[i];
        }
        averageHeight /= this.heightmaps.top.map.length * 2;

        for (var i = 0; i < this.heightmaps.top.map.length; i++) {
            this.heightmaps.top.map[i] -= averageHeight;
            this.heightmaps.bottom.map[i] -= averageHeight;
        }

        this.dimensionsChanged();
    }

    calculateLocalHitbox() {

        var minHeight = Infinity;
        var maxHeight = -Infinity;
        for (var i = 0; i < this.heightmaps.top.map.length; i++) {
            maxHeight = Math.max(maxHeight, this.heightmaps.top.map[i]);
        }

        for (var i = 0; i < this.heightmaps.bottom.map.length; i++) {
            minHeight = Math.min(minHeight, this.heightmaps.bottom.map[i]);
        }

        this.local.hitbox.min = new Vector3(-this.terrainWidth / 2, minHeight, -this.terrainDepth / 2);
        this.local.hitbox.max = new Vector3(this.terrainWidth / 2, maxHeight, this.terrainDepth / 2);

        return this.local.hitbox;
    }

    clampToHeightmap(v) {
        return new Vector3(Math.max(0, Math.min(this.heightmaps.widthSegments, v.x)), v.y, Math.max(0, Math.min(this.heightmaps.depthSegments, v.z)));
    }

    calculateGlobalHitbox(forced = false) {
        if(this.sleeping && !forced){
            return;
        }
        var localHitbox = this.local.hitbox;

        var updateForVertex = function (v) {
            this.global.body.rotation.multiplyVector3InPlace(v).addInPlace(this.global.body.position);
            this.global.hitbox.expandToFitPoint(v);
        }.bind(this);

        this.global.hitbox.min = new Vector3(Infinity, Infinity, Infinity);
        this.global.hitbox.max = new Vector3(-Infinity, -Infinity, -Infinity);

        updateForVertex(localHitbox.min.copy());
        updateForVertex(localHitbox.max.copy());
        var vector = new Vector3();
        vector.x = localHitbox.min.x;
        vector.y = localHitbox.min.y;
        vector.z = localHitbox.max.z;
        updateForVertex(vector);
        vector.x = localHitbox.min.x;
        vector.y = localHitbox.max.y;
        vector.z = localHitbox.min.z;
        updateForVertex(vector);
        vector.x = localHitbox.min.x;
        vector.y = localHitbox.max.y;
        vector.z = localHitbox.max.z;
        updateForVertex(vector);
        vector.x = localHitbox.max.x;
        vector.y = localHitbox.min.y;
        vector.z = localHitbox.min.z;
        updateForVertex(vector);
        vector.x = localHitbox.max.x;
        vector.y = localHitbox.min.y;
        vector.z = localHitbox.max.z;
        updateForVertex(vector);
        vector.x = localHitbox.max.x;
        vector.y = localHitbox.max.y;
        vector.z = localHitbox.min.z;
        updateForVertex(vector);
        return this.global.hitbox;
    }

    setTerrainScale(x) {
        this.terrainScale = x;
        this.inverseTerrainScale = 1 / x;
        this.terrainWidth = this.heightmaps.widthSegments * this.terrainScale;
        this.terrainDepth = this.heightmaps.depthSegments * this.terrainScale;
        this.dimensionsChanged();
    }

    setMaps(top, bottom) {
        this.heightmaps.top.map = top;
        this.heightmaps.bottom.map = bottom;

        this.dimensionsChanged();
    }

    static from2dArrays(top, bottom) {
        var topMap = new Float32Array(top.flat());
        var bottomMap = new Float32Array(bottom.flat());

        return new this({
            heightmaps: {
                width: top[0].length,
                depth: top.length,
                top: { map: topMap },
                bottom: { map: bottomMap }
            }
        });
    }

    static getArrayFromImage(img, scale = 1 / 255) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        top.data = ctx.getImageData(0, 0, img.width, img.height).data;
        var heightmaps = [];
        for (var i = 0; i < data.length; i += 4) {
            var sum = 0;
            var count = 0;
            const amount = 2;
            for (var x = -amount; x <= amount; x++) {
                for (var y = -amount; y <= amount; y++) {
                    var index = i + y * 4 * img.width + x * 4;
                    var a = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    sum += a ? a : 0;
                    count++;
                }
            }
            heightmaps.push(sum / count * scale);
        }
        return heightmaps;
    }

    static fromDimensions(width, depth) {

        return new this({
            heightmaps: {
                width: width,
                depth: depth,
            }
        });
    }

    from2dArrays(top, bottom) {

        this.heightmaps.top.map = new Float32Array(top.flat());
        this.heightmaps.top.hitbox = this.makeHitbox(this.heightmaps.top);

        this.heightmaps.bottom.map = new Float32Array(bottom.flat());
        this.heightmaps.bottom.hitbox = this.makeHitbox(this.heightmaps.bottom);

        this.dimensionsChanged();
        return this;
    }

    getNearestTile(v) {
        var x = Math.floor(v.x);
        var z = Math.floor(v.z);

        x = Math.max(0, Math.min(this.heightmaps.width - 2, x));
        z = Math.max(0, Math.min(this.heightmaps.depth - 2, z));


        return new Vector3(x, 0, z);
    }

    getTriangle(map, v) {
        if (v.z <= 0 || v.z >= this.heightmaps.depthSegments || v.x <= 0 || v.x >= this.heightmaps.widthSegments) {
            return null;
        }
        var v1 = this.getNearestTile(v);
        v1.y = this.getHeight(map, v1);

        var v2 = v1.copy();
        v2.x++;
        v2.y = this.getHeight(map, v2);

        var v3 = v1.copy();
        v3.z++;
        v3.y = this.getHeight(map, v3);



        if (v2.x - v.x > v.z - v1.z) {
            return new Triangle(v2, v1, v3);
        }

        var v4 = v1.copy();
        v4.x++;
        v4.z++;
        v4.y = this.getHeight(map, v4);

        return new Triangle(v2, v3, v4);
    }

    getTrianglePair(map, v) {
        if (v.z <= 0 || v.z >= this.heightmaps.depthSegments || v.x <= 0 || v.x >= this.heightmaps.widthSegments) {
            return null;
        }
        var v1 = this.getNearestTile(v);
        v1.y = this.getHeight(map, v1);

        var v2 = v1.copy();
        v2.x++;
        v2.y = this.getHeight(map, v2);

        var v3 = v1.copy();
        v3.z++;
        v3.y = this.getHeight(map, v3);


        var v4 = v1.copy();
        v4.x++;
        v4.z++;
        v4.y = this.getHeight(map, v4);

        return [new Triangle(v2, v3, v4), new Triangle(v2, v1, v3)];
    }

    getHeightFromHeightmap(map, v) {
        var translated_v = this.translateWorldToHeightmap(v);

        var triangle = this.getTriangle(map, translated_v);
        if (!triangle) {
            return null;
        }

        return this.translateHeightmapToWorld(triangle.getHeight(translated_v));
    }

    translateWorldToHeightmap(v) {
        return this.translateLocalToHeightmap(this.translateWorldToLocal(v));
    }

    translateLocalToHeightmap(v) {
        return v.multiplyInPlace(new Vector3(this.inverseTerrainScale, 1, this.inverseTerrainScale))
            .addInPlace(new Vector3(this.heightmaps.widthSegments / 2, 0, this.heightmaps.depthSegments / 2));
    }

    translateHeightmapToLocal(v) {
        return v.subtract(new Vector3(this.heightmaps.widthSegments / 2, 0, this.heightmaps.depthSegments / 2))
            .multiplyInPlace(new Vector3(this.terrainScale, 1, this.terrainScale));
    }

    translateHeightmapToWorld(v) {
        return this.translateLocalToWorld(this.translateHeightmapToLocal(v));
    }

    getHeight(map, v) {
        return map.map[Math.floor(v.z) * this.heightmaps.width + Math.floor(v.x)];
    }


    calculateMeshVertices(geometry, map) {
        var attrib = geometry.attributes;


        for (var i = 0; i < attrib.position.count; i++) {
            attrib.position.array[i * 3 + 1] = map.map[i];
        }

        attrib.position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
    }

    setMeshAndAddToScene(options, gameEngine) {
        this.setMesh(options, gameEngine);
        this.addToScene(gameEngine);
    }

    setMesh(options, gameEngine) {
        var material = options?.material ?? new gameEngine.graphicsEngine.THREE.MeshPhongMaterial({ color: 0x00ff00 });
        var topGeo = new gameEngine.graphicsEngine.THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, this.heightmaps.widthSegments, this.heightmaps.depthSegments);
        topGeo.rotateX(-Math.PI / 2);
        this.calculateMeshVertices(topGeo, this.heightmaps.top);

        var botGeo = new gameEngine.graphicsEngine.THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, this.heightmaps.widthSegments, this.heightmaps.depthSegments);
        botGeo.rotateX(-Math.PI / 2);
        this.calculateMeshVertices(botGeo, this.heightmaps.bottom);

        var leftGeo = new gameEngine.graphicsEngine.THREE.PlaneGeometry(this.terrainWidth, 1, this.heightmaps.widthSegments, 1);
        leftGeo.translate(0, 0, -this.terrainDepth / 2);

        var leftAttrib = leftGeo.attributes;
        for (var i = 0; i < leftAttrib.position.count; i++) {
            var y = i * 3 + 1;
            if (i < this.heightmaps.width) {
                leftAttrib.position.array[y] = this.heightmaps.top.map[i];
            }
            else {
                leftAttrib.position.array[y] = this.heightmaps.bottom.map[i - this.heightmaps.width];
            }
        }
        leftAttrib.position.needsUpdate = true;
        leftGeo.computeVertexNormals();
        leftGeo.computeBoundingSphere();

        var rightGeo = new gameEngine.graphicsEngine.THREE.PlaneGeometry(this.terrainWidth, 1, this.heightmaps.widthSegments, 1);
        rightGeo.translate(0, 0, this.terrainDepth / 2);

        var rightAttrib = rightGeo.attributes;
        for (var i = 0; i < rightAttrib.position.count; i++) {
            var y = i * 3 + 1;
            if (i < this.heightmaps.width) {
                rightAttrib.position.array[y] = this.heightmaps.top.map[i + this.heightmaps.width * this.heightmaps.depthSegments];
            }
            else {
                rightAttrib.position.array[y] = this.heightmaps.bottom.map[(i - this.heightmaps.width) + this.heightmaps.width * this.heightmaps.depthSegments];
            }
        }
        rightAttrib.position.needsUpdate = true;
        rightGeo.computeVertexNormals();
        rightGeo.computeBoundingSphere();
        var forwardGeo = new gameEngine.graphicsEngine.THREE.PlaneGeometry(this.terrainDepth, 1, this.heightmaps.depthSegments, 1);
        forwardGeo.rotateY(-Math.PI / 2);
        forwardGeo.translate(this.terrainWidth / 2, 0, 0);

        var forwardAttrib = forwardGeo.attributes;
        for (var i = 0; i < forwardAttrib.position.count; i++) {
            var y = i * 3 + 1;
            if (i < this.heightmaps.depth) {
                forwardAttrib.position.array[y] = this.heightmaps.top.map[i * this.heightmaps.width + this.heightmaps.width - 1];
            }
            else {
                forwardAttrib.position.array[y] = this.heightmaps.bottom.map[(i - this.heightmaps.depth) * this.heightmaps.width + this.heightmaps.width - 1];
            }
        }
        forwardAttrib.position.needsUpdate = true;
        forwardGeo.computeVertexNormals();
        forwardGeo.computeBoundingSphere();

        var backGeo = new gameEngine.graphicsEngine.THREE.PlaneGeometry(this.terrainDepth, 1, this.heightmaps.depthSegments, 1);
        backGeo.rotateY(-Math.PI / 2);
        backGeo.translate(-this.terrainWidth / 2, 0, 0);

        var backAttrib = backGeo.attributes;
        for (var i = 0; i < backAttrib.position.count; i++) {
            var y = i * 3 + 1;
            if (i < this.heightmaps.depth) {
                backAttrib.position.array[y] = this.heightmaps.top.map[i * this.heightmaps.width];
            }
            else {
                backAttrib.position.array[y] = this.heightmaps.bottom.map[(i - this.heightmaps.depth) * this.heightmaps.width];
            }
        }
        backAttrib.position.needsUpdate = true;
        backGeo.computeVertexNormals();
        backGeo.computeBoundingSphere();


        this.mesh = gameEngine.graphicsEngine.meshLinker.createMeshData(new gameEngine.graphicsEngine.THREE.Mesh());

        var topMaterial = material.clone();
        var botMaterial = material.clone();
        botMaterial.side = gameEngine.graphicsEngine.THREE.BackSide;
        var leftMaterial = material.clone();
        leftMaterial.side = gameEngine.graphicsEngine.THREE.BackSide;
        var rightMaterial = material.clone();
        var forwardMaterial = material.clone();
        forwardMaterial.side = gameEngine.graphicsEngine.THREE.BackSide;
        var backMaterial = material.clone();


        var topMesh = new gameEngine.graphicsEngine.THREE.Mesh(topGeo, topMaterial);
        var botMesh = new gameEngine.graphicsEngine.THREE.Mesh(botGeo, botMaterial);
        var leftMesh = new gameEngine.graphicsEngine.THREE.Mesh(leftGeo, leftMaterial);
        var rightMesh = new gameEngine.graphicsEngine.THREE.Mesh(rightGeo, rightMaterial);
        var forwardMesh = new gameEngine.graphicsEngine.THREE.Mesh(forwardGeo, forwardMaterial);
        var backMesh = new gameEngine.graphicsEngine.THREE.Mesh(backGeo, backMaterial);

        this.mesh.mesh.add(topMesh);
        this.mesh.mesh.add(botMesh);
        this.mesh.mesh.add(leftMesh);
        this.mesh.mesh.add(rightMesh);
        this.mesh.mesh.add(forwardMesh);
        this.mesh.mesh.add(backMesh);
    }
};

ClassRegistry.register(Terrain3);

export default Terrain3;