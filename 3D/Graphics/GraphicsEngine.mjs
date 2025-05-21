import * as THREE from "three";
import { EffectComposer, RenderPass, BloomEffect, CopyPass, EffectPass, ToneMappingEffect } from "postprocessing";
import { N8AOPostPass } from './N8AO.mjs';
import AutoTextureLoader from "./AutoTextureLoader.mjs";
import MeshLinker from "./MeshLinker.mjs";
import Vector3 from "../Physics/Math3D/Vector3.mjs";

var GraphicsEngine = class {
    constructor(options) {
        this.THREE = THREE;
        this.window = options?.window ?? window;
        this.document = options?.document ?? document;

        this.container = options?.canvas?.parent ?? this.document.body;
        this.renderer = new this.THREE.WebGLRenderer({
            canvas: options?.canvas ?? null
        });

        this.canvas = this.renderer.domElement;

        this.renderer.toneMapping = this.THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.outputEncoding = this.THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        this.screenWidth = this.container.clientWidth;
        this.screenHeight = this.container.clientHeight;

        var resizeObserver = new ResizeObserver(function () {
            this.screenWidth = this.container.clientWidth;
            this.screenHeight = this.container.clientHeight;
            this.updateScreenSize();
        }.bind(this));
        resizeObserver.observe(this.container);

        this.meshLinker = new MeshLinker();

        this.scene = new this.THREE.Scene();
        this.renderDistance = options?.renderDistance ?? 4096;
        this.camera = new this.THREE.PerspectiveCamera(options?.camera?.fov ?? 90, this.aspectRatio(), options?.camera?.near ?? 0.1, options?.cameraFar ?? options?.camera?.far ?? this.renderDistance);
        this.fog = new this.THREE.Fog(0xFFFFFF);
        this.fogRatio = options?.fogRatio ?? 0.9;
        this.scene.fog = this.fog;
        this.scene.add(this.camera);

        this.textureLoader = new AutoTextureLoader();
        this.mixers = [];
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.renderPass.renderToScreen = false;
        this.composer.addPass(this.renderPass);

        this.n8aoPass = new N8AOPostPass(this.scene, this.camera, this.screenWidth, this.screenHeight);
        this.n8aoPass.configuration.aoRadius = 0.5;
        this.n8aoPass.renderToScreen = false;
        this.n8aoPass.enabled = false;
        this.composer.addPass(this.n8aoPass);

        this.bloomEffect = new BloomEffect({
            intensity: 1.5,
            radius: 0.5,
            threshold: 1.5
        })
        this.bloomPass = new EffectPass(this.camera, this.bloomEffect);
        this.bloomPass.enabled = false;
        this.composer.addPass(this.bloomPass);


        this.lights = [];
        this.shadowBias = -0.001;
        this.setupLights();

        this.updateScreenSize();

        this.copyPass = new CopyPass();
        this.composer.addPass(this.copyPass);

        this.startTime = null;

        this.mousePosition = new Vector3(0, 0, 0);
        this.raycaster = new this.THREE.Raycaster();

        this.window.addEventListener("mousemove", function (event) {
            this.mousePosition.x = (event.clientX / this.screenWidth) * 2 - 1;
            this.mousePosition.y = -(event.clientY / this.screenHeight) * 2 + 1;
        }.bind(this));

    }

    parseRaycastResult(raycast){
        if(!raycast){
            return raycast;
        }
        raycast.normal = raycast.normal.clone().applyMatrix3(new this.THREE.Matrix3().getNormalMatrix(raycast.object.matrixWorld)).normalize();
        return raycast;
    }

    raycastFirst(options) {
        if(options?.direction && options?.origin){
            this.raycaster.ray.origin.set(...options.origin);
            this.raycaster.ray.direction.set(...options.direction);
        }
        else{
            this.raycaster.setFromCamera(this.mousePosition, this.camera);
        }
        this.raycaster.far = options?.far;
        const intesections = this.raycaster.intersectObjects(this.scene.children, true);
        this.raycaster.far = Infinity;
        var onlyPhysicsObjects = options?.onlyPhysicsObjects ?? false;
        for (var i of intesections) {
            if (i.face == null && !i.normal) {
                continue;
            }
            if(onlyPhysicsObjects && !i.object?.isPhysicsObject){
                continue;
            }
            return this.parseRaycastResult(i);
        }
        return null;
    }

    set cameraFar(far) {
        this.camera.far = far;
    }

    get cameraFar() {
        return this.camera.far;
    }

    updateScreenSize() {
        this.renderer.setSize(this.screenWidth, this.screenHeight);
        this.composer.setSize(this.screenWidth, this.screenHeight);
        this.camera.aspect = this.aspectRatio();
        this.camera.updateProjectionMatrix();
    }

    aspectRatio() {
        return this.screenWidth / this.screenHeight;
    }

    update(previousWorld, world, lerpAmount) {
        if (!this.startTime) {
            this.startTime = performance.now();
        }
        this.meshLinker.update(previousWorld, world, lerpAmount);
    }
    render() {
        for (const mixer of this.mixers) {
            mixer.update(16 / 1000)
        }
        this.sunlight.position.copy(this.camera.position);
        this.sunlight.position.sub(this.sunlight.direction.clone().multiplyScalar(this.sunlight.shadow.camera.far * 0.5));
        this.sunlight.target.position.addVectors(this.sunlight.position, this.sunlight.direction);
        this.fog.near = this.renderDistance * this.fogRatio;
        this.fog.far = this.renderDistance;
        this.composer.render();
    }

    createAnimations(model, animations) {
        const mixer = new this.THREE.AnimationMixer(model);
        const actions = [];
        for (const animation of animations) {
            actions.push(mixer.clipAction(animation));
        }
        this.mixers.push(mixer);
        return {
            mixer: mixer,
            actions: actions
        }
    }

    setBackgroundImage(url, setBackground = true, setEnvironment = false) {
        this.textureLoader.load(url).then(function (texture, extension) {
            var pmremGenerator = new this.THREE.PMREMGenerator(this.renderer);
            pmremGenerator.compileEquirectangularShader();
            texture = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();

            if (setBackground) {
                this.scene.background = texture;
            }

            if (setEnvironment) {
                this.scene.environment = texture;
            }

            texture.dispose();

        }.bind(this));
    }

    setupLights() {

        this.ambientLight = new this.THREE.AmbientLight(0xbbbbbb, 2);
        this.scene.add(this.ambientLight);
        this.lights.push(this.ambientLight);

        var range = 256;

        this.sunlight = new this.THREE.DirectionalLight(0xffffff, 1);
        this.sunlight.direction = new this.THREE.Vector3(0, -1, 0);
        this.sunlight.castShadow = true;
        this.sunlight.shadow.mapSize.width = 2048;
        this.sunlight.shadow.mapSize.height = 2048;
        this.sunlight.shadow.camera.near = 0.1;
        this.sunlight.shadow.camera.far = 2048;
        this.sunlight.shadow.camera.left = -range;
        this.sunlight.shadow.camera.right = range;
        this.sunlight.shadow.camera.top = range;
        this.sunlight.shadow.camera.bottom = -range;
        this.sunlight.shadow.bias = this.shadowBias;
        this.scene.add(this.sunlight);
        this.scene.add(this.sunlight.target);

        this.lights.push(this.sunlight);

    }

    setSunlightDirection(direction) {
        this.sunlight.direction = new this.THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    }

    setSunlightBrightness(brightness) {
        this.sunlight.intensity = brightness;
    }

    disableSunlight() {
        this.sunlight.visible = false;
    }

    enableSunlight() {
        this.sunlight.visible = true;
    }


    addToScene(object) {
        this.scene.add(object);
    }


    async load(url, onLoad, onProgress, onError) {
        return this.textureLoader.load(url, onLoad, onProgress, onError);
    }

    enableAO() {
        this.n8aoPass.enabled = true;
    }

    disableAO() {
        this.n8aoPass.enabled = false;
    }

    enableBloom(){
        this.bloomPass.enabled = true;
    }

    disableBloom(){
        this.bloomPass.enabled = false;
    }

    disableShadows() {
        this.renderer.shadowMap.enabled = false;
    }

    enableShadows() {
        this.renderer.shadowMap.enabled = true;
    }
}



export default GraphicsEngine;