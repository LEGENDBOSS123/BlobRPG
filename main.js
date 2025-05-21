import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
import World from "./3D/Physics/Core/World.mjs";

import SimpleCameraControls from "./3D/SimpleCameraControls.mjs";
import CameraTHREEJS from "./3D/CameraTHREEJS.mjs";
import Player from "./3D/Entity/Player.mjs"

import Stats from "./3D/Web/Stats.mjs";
import GraphicsEngine from "./3D/Graphics/GraphicsEngine.mjs";

import * as THREE from "three";
import EntitySystem from "./3D/Entity/EntitySystem.mjs";
import Timer from "./3D/Physics/Core/Timer.mjs";
import ParticleSystem from "./3D/Graphics/Particle/ParticleSystem.mjs";
import Particle from "./3D/Graphics/Particle/Particle.mjs";
import TextParticle from "./3D/Graphics/Particle/TextParticle.mjs";
import DistanceConstraint from "./3D/Physics/Collision/DistanceConstraint.mjs";
import GameEngine from "./3D/GameEngine.mjs";
import Sphere from "./3D/Physics/Shapes/Sphere.mjs";

import Inventory from "./3D/Web/Inventory/Inventory.mjs";
import InventorySlot from "./3D/Web/Inventory/InventorySlot.mjs";
import InventoryItem from "./3D/Web/Inventory/InventoryItem.mjs";

var stats = new Stats();
var stats2 = new Stats();

stats.showPanel(0);
document.body.appendChild(stats.dom);

stats2.showPanel(0);
stats2.dom.style.left = "85px";
document.body.appendChild(stats2.dom);

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener('keydown', function (e) {
    if (e.key == "r") {
        player.respawn();
        return;
    }
});



var gameEngine = new GameEngine(
    {
        graphicsEngine: {
            window: window,
            document: document,
            container: document.body,
            canvas: document.getElementById("canvas")
        },
        gameCamera: {
            pullback: 0,
            maxPullback: 100
        },
        cameraControls: {
            speed: 1,
            pullbackRate: 0.2,
            rotateMethods: {
                wheel: true,
                shiftLock: true,
                drag: true
            },
            rotateSensitivity: {
                wheel: 0.01,
                shiftLock: 0.01,
                drag: 0.01
            },
            shiftLockCursor: document.getElementById('shiftlockcursor'),
            window: window,
            document: document,
        },
        particleSystem: {},
        fps: 20

    }
);
window.gameEngine = gameEngine;
gameEngine.graphicsEngine.ambientLight.intensity = 1;
gameEngine.graphicsEngine.setBackgroundImage("autumn_field_puresky_8k.hdr", true, false);
gameEngine.graphicsEngine.setSunlightDirection(new Vector3(-2, -8, -5));
gameEngine.graphicsEngine.setSunlightBrightness(1);
gameEngine.graphicsEngine.renderDistance = 1600;
gameEngine.graphicsEngine.cameraFar = 2000;
gameEngine.cameraControls.renderDomElement = gameEngine.graphicsEngine.canvas;
gameEngine.cameraControls.setupEventListeners();



gameEngine.cameraControls.addKeyBinds(
    {
        ArrowUp: "forward",
        KeyW: "forward",
        ArrowDown: "backward",
        KeyS: "backward",
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right",
        Space: "up",
        ShiftLeft: "down",
        ShiftRight: "down",
        KeyO: "zoomOut",
        KeyI: "zoomIn"
    }
);

gameEngine.world.setSubsteps(4);
gameEngine.world.setIterations(16);

var gravity = -0.4;
var player = new Player({
    radius: 1,
    height: 1,
    tiltable: false,
    moveStrength: 0.5,
    airMoveStrength: 0.1,
    moveSpeed: 0.2,
    jumpSpeed: 0.4,
    gravity: new Vector3(0, gravity, 0),
    position: new Vector3(0, 30, 0),
    mass: 1,
    graphicsEngine: gameEngine.graphicsEngine
});



player.setMeshAndAddToScene({}, gameEngine);
gameEngine.entitySystem.register(player);
player.addToWorld(gameEngine.world);

var inventory = new Inventory({
    rows: 4,
    columns: 6,
    document: document
})

inventory.createHTML({
    container: document.getElementById("inventory"),
    overflow: false
})

var hotbar = new Inventory({
    rows: 1,
    columns: 9,
    document: document
})

hotbar.createHTML({
    container: document.getElementById("hotbar"),
    overflow: false
})

inventory.getSlot(0, 0).setItem(new InventoryItem({
    name: "Sword",
    quantity: 1,
    icon: "data:image/png;base64,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"
}))
for (var i = 0; i < 3; i++) {


    inventory.getSlot(0, i).setItem(new InventoryItem({
        name: "Sword",
        quantity: 1,
        icon: "data:image/png;base64,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"
    }))

}
var map = await gameEngine.loadMap("map.glb", {});

for (const obj of map.objects) {
    gameEngine.world.addComposite(obj);
    if (obj.name.toLowerCase().includes("death")) {
        obj.addEventListener("collision", function (contact) {
            var player = null;
            if (gameEngine.entitySystem.getEntityFromShape(contact.body1) instanceof Player) {
                player = gameEngine.entitySystem.getEntityFromShape(contact.body1);
            }
            else if (gameEngine.entitySystem.getEntityFromShape(contact.body2) instanceof Player) {
                player = gameEngine.entitySystem.getEntityFromShape(contact.body2);
            }

            if (!player) {
                return;
            }
            player.respawn();
        })
    }
    if (obj.name.toLowerCase().includes("start")) {
        player.setStartPoint(obj.global.body.position);
        player.respawn();
    }
    if (obj.name.toLowerCase().includes("start") || obj.name.toLowerCase().includes("checkpoint")) {
        obj.addEventListener("collision", function (contact) {
            var player = null;
            if (gameEngine.entitySystem.getEntityFromShape(contact.body1) instanceof Player) {
                player = gameEngine.entitySystem.getEntityFromShape(contact.body1);
            }
            else if (gameEngine.entitySystem.getEntityFromShape(contact.body2) instanceof Player) {
                player = gameEngine.entitySystem.getEntityFromShape(contact.body2);
            }

            if (!player) {
                return;
            }
            player.setSpawnPoint(player.getMainShape().global.body.position, true);
        })
    }
}
for (var mesh of map.meshes) {
    //gameEngine.graphicsEngine.addToScene(mesh);
}
for (var entity of map.entities) {
    entity.setMeshAndAddToScene({}, gameEngine);
    gameEngine.entitySystem.register(entity);
    entity.addToWorld(gameEngine.world);
}
gameEngine.graphicsEngine.addToScene(map.gltf.scene)



gameEngine.timer.schedule(gameEngine.fpsStepper);

function render() {
    stats.begin();
    gameEngine.cameraControls.update();


    gameEngine.fpsStepper.job = function () {
        player.updateKeys(gameEngine);
        gameEngine.cameraControls.reset();
        gameEngine.updateEntitiesStep();

        stats2.begin();
        gameEngine.stepWorld();
        stats2.end();
    }
    inventory.update();
    hotbar.update();
    gameEngine.updateEntities();
    gameEngine.updateGraphicsEngine();
    gameEngine.updateGameCamera(Vector3.from(player.getMainShape()?.mesh?.mesh?.position ?? player.getMainShape().global.body.position.copy()));
    gameEngine.particleSystem.update();
    gameEngine.graphicsEngine.render();
    gameEngine.timer.step();
    requestAnimationFrame(render);

    stats.end();
}


render();