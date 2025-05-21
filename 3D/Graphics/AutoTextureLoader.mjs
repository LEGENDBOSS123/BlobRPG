import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';



var AutoTextureLoader = class {
    constructor(options) {
        this.specialLoaders = {
            "glb": GLTFLoader,
            "gltf": GLTFLoader,
            "exr": EXRLoader,
            "hdr": RGBELoader
        }
        this.assetsDirectory = options?.assetsDirectory ?? new URL('.', import.meta.url).href + "Assets/";
    }

    resolvePath(path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('./')) {
            return path;
        }
        return new URL(path, this.assetsDirectory).href;
    }

    
    async load(url) {
        var path = this.resolvePath(url);
        var extension = path.split('.').pop().toLowerCase();
        if (this.specialLoaders[extension]) {
            var loader = new this.specialLoaders[extension];
            return loader.loadAsync(path);
        }
        return new THREE.TextureLoader().loadAsync(path);
    }
}


export default AutoTextureLoader;