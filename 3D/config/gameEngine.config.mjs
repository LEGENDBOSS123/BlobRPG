export default {
    graphicsEngine: {
        window: window,
        document: document,
        container: document.body,
        canvas: document.getElementById('canvas'),
        renderDistance: 2048,
        fogRatio: 0.8
    },
    gameCamera: {
        pullback: 8,
        maxPullback: 16,
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
