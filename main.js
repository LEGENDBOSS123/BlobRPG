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
import Slime from "./3D/Entity/Slime.mjs";
import Inventory from "./3D/Web/Inventory/Inventory.mjs";
import InventorySlot from "./3D/Web/Inventory/InventorySlot.mjs";
import InventoryItem from "./3D/Web/Inventory/InventoryItem.mjs";
import Modal from "./3D/Web/Modal/Modal.mjs";
import Hotbar from "./3D/Web/Inventory/Hotbar.mjs";
import ToastManager from "./3D/Web/Toast/ToastManager.mjs";
import ProgressBar from "./3D/Web/ProgressBar/ProgressBar.mjs";
import Settings from "./3D/Web/Settings/Settings.mjs";
import Tooltip from "./3D/Web/Tooltip/Tooltip.mjs";
import ShopInventory from "./3D/Web/ShopInventory/ShopInventory.mjs";
import Item from "./3D/Item/Item.mjs";
import Sword from "./3D/Item/Sword.mjs";
import Apple from "./3D/Item/Apple.mjs";
import ShopOffer from "./3D/Web/ShopInventory/ShopOffer.mjs";
import Toast from "./3D/Web/Toast/Toast.mjs";
import Counter from "./3D/Web/Counter/Counter.mjs";
import LongSword from "./3D/Item/LongSword.mjs";
import LightSaber from "./3D/Item/LightSaber.mjs";
import Box from "./3D/Physics/Shapes/Box.mjs";
import Composite from "./3D/Physics/Shapes/Composite.mjs";
import ShopKeeper from "./3D/Entity/ShopKeeper.mjs";
import Coin from "./3D/Entity/Coin.mjs";


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

var gameEngine = new GameEngine(
    {
        graphicsEngine: {
            window: window,
            document: document,
            container: document.body,
            canvas: document.getElementById('canvas'),
        },
        gameCamera: {
            pullback: 4,
            maxPullback: 8,
            minPullback: 2
        },
        cameraControls: {
            speed: 1,
            pullbackRate: 0.1,
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
gameEngine.graphicsEngine.ambientLight.intensity = 3;
gameEngine.graphicsEngine.setBackgroundImage("autumn_field_puresky_8k.hdr", true, false);
gameEngine.graphicsEngine.setSunlightDirection(new Vector3(-2, -8, -5));
gameEngine.graphicsEngine.setSunlightBrightness(1);
gameEngine.graphicsEngine.renderDistance = 1600;
gameEngine.graphicsEngine.cameraFar = 2000;
gameEngine.cameraControls.renderDomElement = gameEngine.graphicsEngine.canvas;
gameEngine.cameraControls.setupEventListeners();


gameEngine.toastManager.createHTML({
    container: document.body,
    width: 300
});




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

gameEngine.soundManager.addSounds({
    "toast": "correct-answer.wav",
    "click": "click.m4a",
    "damage": "damage.mp3"
})

const healthBar = new ProgressBar({
    gameEngine: gameEngine,
    title: "HEALTH"
});

healthBar.createHTML({
    container: document.body,
    width: 300,
    height: 20
})

healthBar.html.style.top = "5px";
healthBar.html.style.right = "15px";


const cashCounter = new Counter({
    gameEngine: gameEngine,
    title: "CASH",
    prefix: ":       $"
});

cashCounter.createHTML({
    container: document.body,
    height: 20
})

cashCounter.html.style.top = "50px";
cashCounter.html.style.right = "25px";


const settings = new Settings({
    gameEngine: gameEngine,
    title: "Settings"
});

top.s = settings;


var panel = new Settings.Panel({
    buttons: {
        "Graphics": new Settings.Screen({
            elements: [
                new Settings.Checkbox({
                    label: "Ambient Occlusion",
                    name: "ambient_occlusion",
                    default: false
                }),
                new Settings.Checkbox({
                    label: "Bloom",
                    name: "bloom",
                    default: false
                }),
                new Settings.Checkbox({
                    label: "Shadows",
                    name: "shadows",
                    default: true
                })
            ]
        }),
        "Sound": new Settings.Screen({
            elements: [
                new Settings.Slider({
                    label: "Volume",
                    name: "volume",
                    min: 0,
                    max: 100,
                    default: 75,
                    decimalPlaces: 1
                })
            ]
        }),
        "Controls": new Settings.Screen({
            elements: [
                new Settings.Slider({
                    label: "Wheel Sensitivity",
                    name: "wheel_sensitivity",
                    min: 0,
                    max: 0.05,
                    default: 0.01,
                    decimalPlaces: 4
                }),
                new Settings.Slider({
                    label: "Drag Sensitivity",
                    name: "drag_sensitivity",
                    min: 0,
                    max: 0.05,
                    default: 0.01,
                    decimalPlaces: 4
                }),
                new Settings.Slider({
                    label: "Shift Lock Sensitivity",
                    name: "shift_lock_sensitivity",
                    min: 0,
                    max: 0.05,
                    default: 0.01,
                    decimalPlaces: 4
                }),
                new Settings.KeybindMenu({
                    name: "keybinds",
                    keybinds: gameEngine.cameraControls.keybinds
                })
            ]
        }),
        "Gameplay": new Settings.Screen({

        }),
        "Interface": new Settings.Screen({

        }),
        "Options": new Settings.Screen({

        }),
        "Account": new Settings.Screen({

        }),
        "Privacy": new Settings.Screen({

        }),
        "Network": new Settings.Screen({

        }),
        "Experimental": new Settings.Screen({

        })
    },
    htmlOptions: {
        width: 120,
        side: "left"
    }
});

settings.addComponent(panel);

settings.createHTML({
    container: document.body,
    overflow: true,
    width: 750,
    height: 500,
    centered: true
});

settings.close();

window.onbeforeunload = function () {
    settings.save();
}

settings.onSettingsChange("volume", function (volume) {
    gameEngine.soundManager.setVolume(volume / 100);
});

settings.onSettingsChange("ambient_occlusion", function (ao) {
    if (ao) {
        gameEngine.graphicsEngine.enableAO();
    }
    else {
        gameEngine.graphicsEngine.disableAO();
    }
});

settings.onSettingsChange("wheel_sensitivity", function (s) {
    gameEngine.cameraControls.rotateSensitivity.wheel = s;
});

settings.onSettingsChange("drag_sensitivity", function (s) {
    gameEngine.cameraControls.rotateSensitivity.drag = s;
});

settings.onSettingsChange("shift_lock_sensitivity", function (s) {
    gameEngine.cameraControls.rotateSensitivity.shiftLock = s;
});

settings.onSettingsChange("keybinds", function (kb) {
    gameEngine.cameraControls.keybinds = {};
    gameEngine.cameraControls.addKeyBinds(Settings.KeybindMenu.toCameraControlsFormat(kb));
});

settings.onSettingsChange("bloom", function (ao) {
    if (ao) {
        gameEngine.graphicsEngine.enableBloom();
    }
    else {
        gameEngine.graphicsEngine.disableBloom();
    }
});

settings.onSettingsChange("shadows", function (ao) {
    if (ao) {
        gameEngine.graphicsEngine.enableShadows();
    }
    else {
        gameEngine.graphicsEngine.disableShadows();
    }
});

settings.load();


gameEngine.world.setSubsteps(4);
gameEngine.world.setVelocityIterations(16);
gameEngine.world.setPenetrationIterations(8);

var gravity = -0.35;

var player = new Player({
    radius: 0.5,
    height: 3,
    tiltable: false,
    moveStrength: 0.5,
    airMoveStrength: 0.25,
    moveSpeed: 0.125,
    jumpSpeed: 0.25,
    gravity: new Vector3(0, gravity, 0),
    mass: 1,
    gameEngine: gameEngine,
});
player.setMeshAndAddToScene({}, gameEngine);
gameEngine.entitySystem.register(player);
player.addToWorld(gameEngine.world);

for (var i = 0; i < 1; i++) {
    const box = new Box({
        width: 5 + Math.random() * 5,
        height: 3 + Math.random() * 3,
        depth: 5 + Math.random() * 5,
        global: {
            body: {
                position: new Vector3(10 + 4, 16 + i * 3, 4),
                acceleration: new Vector3(0, gravity, 0),
            }
        },
        local: {
            body: {
                mass: 1
            }
        },
    });
    box.setFriction(0.5);
    box.setRestitution(0);
    box.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);

    box.setMeshAndAddToScene({}, gameEngine);
    gameEngine.world.addComposite(box);
}


for (var i = 0; i < 20; i++) {
    var slime = new Slime({
        gameEngine: gameEngine,
        gravity: new Vector3(0, gravity, 0),
        position: new Vector3(0 + i * 0.1, 20 + i * 2, 0 + Math.random() * 5),
        radius: 1 + Math.random() * 1,
    })

    slime.setMeshAndAddToScene({}, gameEngine);
    gameEngine.entitySystem.register(slime);
    slime.addToWorld(gameEngine.world);
    slime.getTargets = function () {
        return [player.id];
    }
}


var toolTip = new Tooltip({
    gameEngine: gameEngine
});

toolTip.createHTML({
    container: document.body,
    width: 120,
    height: 90
});

const sword = new Sword({
    gameEngine: gameEngine,
    name: "Sword",
    iconPath: "./3D/Graphics/Assets/sword.png",
    type: "weapon"
});


const longSword = new LongSword({
    gameEngine: gameEngine,
    name: "Long Sword",
    iconPath: "./3D/Graphics/Assets/sword.png",
    type: "weapon"
});
const lightSaber = new LightSaber({
    gameEngine: gameEngine,
    name: "Light Saber",
    iconPath: "./3D/Graphics/Assets/sword.png",
    type: "weapon"
});
const apple = new Apple({
    gameEngine: gameEngine,
    name: "Apple",
    iconPath: "./3D/Graphics/Assets/apple.png",
    type: "consumable"
});

var shopInventory = new ShopInventory({
    gameEngine: gameEngine,
    document: document,
    title: "Shop Inventory"
});

shopInventory.createHTML({
    container: document.body,
    overflow: true,
    width: 750,
    height: 500,
    centered: true
});

shopInventory.purchaseCallback = function (item, quantity) {
    var index = inventory.emptyIndex();
    var hotbarIndex = hotbar.emptyIndex();
    if ((index == -1 && hotbarIndex == -1) || player.cash - item.price * quantity < 0) {
        if (index == -1) {
            this.gameEngine.toastManager.createToast({ duration: 1000, type: Toast.TYPES.ERROR, message: "Inventory and hotbar full" });
        }
        else {
            this.gameEngine.toastManager.createToast({ duration: 1000, type: Toast.TYPES.ERROR, message: "Cannot afford purchase" });
        }
        return 0;
    }
    player.cash -= item.price * quantity;
    let emptySlot;
    if (hotbarIndex != -1) {
        emptySlot = hotbar.getSlot(hotbarIndex.x, hotbarIndex.y);
    }
    else {
        emptySlot = inventory.getSlot(index.x, index.y);
    }
    emptySlot.item = new InventoryItem({
        gameEngine: this.gameEngine,
        item: item.item.clone()
    });

    emptySlot.item.item.quantity = quantity;
    emptySlot.update();

    return quantity;
};

shopInventory.close();

shopInventory.items = [
    new ShopOffer({
        gameEngine: gameEngine,
        item: sword.clone(),
        price: 50
    }),
    new ShopOffer({
        gameEngine: gameEngine,
        item: apple.clone(),
        price: 10,
        quantity: Infinity
    }),
    new ShopOffer({
        gameEngine: gameEngine,
        item: longSword.clone(),
        price: 150,
        quantity: 1
    }),
    new ShopOffer({
        gameEngine: gameEngine,
        item: lightSaber.clone(),
        price: 1250,
        quantity: 1
    })
];

shopInventory.updateItems();

var inventory = new Inventory({
    gameEngine: gameEngine,
    rows: 12,
    columns: 8,
    document: document,
    title: "Inventory",
    hideOnClose: true
})

inventory.createHTML({
    container: document.body,
    overflow: true,
    width: 750,
    height: 500
})

inventory.modal.hide();

var hotbar = new Hotbar({
    rows: 1,
    columns: 9,
    document: document,
    closeable: false,
    fullscreenable: false,
    resizable: false,
    draggable: false,
    gameEngine: gameEngine
});
player.hotbarElement = hotbar;
player.inventoryElement = inventory;

document.addEventListener("click", function (e) {
    player.useSelectedItem();
})


hotbar.createHTML({
    container: document.body,
    overflow: false,
    width: 600,
    height: 70.2337,
    gap: "4px"
});

var setHotbarPosition = function () {
    hotbar.modal.center();
    hotbar.modal.html.style.top = `${hotbar.modal.html.parentElement.clientHeight - hotbar.modal.html.offsetHeight - 25}px`;
}


setHotbarPosition();

document.addEventListener("keydown", function (e) {
    if (e.key == "e") {
        inventory.modal.toggleShowHide();
    }
    if (e.key == "Escape") {
        settings.toggleOpenClose();
    }
});

// for (var x = 1; x < 8; x++) {
//     for (var y = 1; y < 10; y++) {

//         inventory.getSlot(x, y).setItem(new InventoryItem({
//             gameEngine: gameEngine,
//             item: Math.random() > 0.2 ? apple.clone() : sword.clone()
//         }))
//     }
// }


var map = await gameEngine.loadMap("lawn.glb", {
    "ShopKeeper": ShopKeeper,
    "Coin": Coin,
    "Slime": Slime
});
var damageTimeStamp = 0;
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
            player.takeDamage(player.health)
            if (performance.now() - damageTimeStamp > 100) {
                gameEngine.soundManager.play("damage");
                damageTimeStamp = performance.now();
            }
        });
    }
    if (obj.name.toLowerCase().includes("start")) {
        player.setStartPoint(obj.global.body.position, true);
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
    if (obj.name.toLowerCase().includes("shop")) {
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
            shopInventory.open();
        })
    }
}
for (var mesh of map.meshes) {
    //gameEngine.graphicsEngine.addToScene(mesh);
}
for (var entity of map.entities) {
    if (entity.usesInstancing) {
        entity.setMeshAndAddToScene({}, gameEngine);
    }
    else {
        entity.setMeshAndAddToScene({}, gameEngine);
    }
    gameEngine.entitySystem.register(entity);
    entity.addToWorld(gameEngine.world);

    if(entity instanceof Slime){
        entity.getTargets = function () {
            return [player.id];
        }
        entity.setGravity(new Vector3(0, gravity, 0),);
    }
}
gameEngine.graphicsEngine.addToScene(map.gltf.scene)



gameEngine.timer.schedule(gameEngine.fpsStepper);

gameEngine.toastManager.createToast({ duration: 1000, type: 0, message: "Map Loaded" })


var infoModal = new Modal({
    content: document.createElement('p'),
    resizable: false,
    fullscreenable: false,
    draggable: false,
    closeable: true,
    title: "Instructions"
});
infoModal.createHTML({
    container: document.body,
    width: 400,
    height: 200,
    centered: true
});
infoModal.content.innerHTML = "Press [E] to open inventory, and [Escape] to open settings<br>Go to the shop to buy a sword or an apple.<br>Make sure you avoid the slimes.<br>Good Luck!";
infoModal.content.style = `padding: 20px; text-align: center; font-size: 20px;`;

setTimeout(function () {
    infoModal.close();
}, 4000);
var winInterv = setInterval(function () {
    var done = true;
    var first = true;
    for (var i in gameEngine.entitySystem.all) {
        if (first) {
            first = false;
            continue;
        }

        if (gameEngine.entitySystem.all[i].health > 0) {
            done = false;
        }
    }
    if (done || player.health <= 0) {
        infoModal.content.innerHTML = "You Win!";
        if (player.health <= 0) {
            infoModal.content.innerHTML = "You Lose!";
        }
        infoModal.open();
        clearInterval(winInterv);
    }

}, 100);

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
    toolTip.update();
    inventory.update();
    shopInventory.update();
    setHotbarPosition();
    hotbar.update();
    healthBar.value = player.health;
    healthBar.max = player.maxHealth;
    healthBar.update();
    cashCounter.value = player.cash;
    cashCounter.update();
    settings.update();



    gameEngine.particleSystem.update();
    gameEngine.updateGraphicsEngine();
    gameEngine.updateEntities();
    gameEngine.graphicsEngine.updateModelPool();
    gameEngine.updateGameCamera(Vector3.from(player.getMainShape()?.mesh?.mesh?.position ?? player.getMainShape().global.body.position.copy()));
    gameEngine.graphicsEngine.render();
    gameEngine.timer.step();
    requestAnimationFrame(render);

    stats.end();
}


render();