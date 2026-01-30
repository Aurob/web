import * as THREE from 'three';
import { initPhysics, stepPhysics, getCollisionEvents } from './physics.js';
import { initSoundSystem, processCollisions, getAudibleSounds, playSound } from './sound-system.js';
import { registerScene, getSceneFromURL, loadScene, updateScene, onSceneClick } from './scene-loader.js';

// Import scenes
import * as fallingScene from './scenes/falling.js';
import * as swingScene from './scenes/swing.js';
import * as sway1Scene from './scenes/sway1.js';
import * as pend1Scene from './scenes/pend1.js';

// Register available scenes
registerScene('falling', fallingScene);
registerScene('swing', swingScene);  // Default: 5x5 grid
registerScene('sway1', sway1Scene);
registerScene('pend1', pend1Scene);  // Single pendulum

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

// Fly camera controls
let flyCameraEnabled = false;
const flySpeed = 20;
const flyKeys = { w: false, a: false, s: false, d: false, q: false, e: false };
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

function updateFlyCamera(dt) {
    if (!flyCameraEnabled) return;

    const moveSpeed = flySpeed * dt;
    const direction = new THREE.Vector3();

    // Get forward/right vectors from camera
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    if (flyKeys.w) direction.add(forward);
    if (flyKeys.s) direction.sub(forward);
    if (flyKeys.d) direction.add(right);
    if (flyKeys.a) direction.sub(right);
    if (flyKeys.e) direction.y += 1;
    if (flyKeys.q) direction.y -= 1;

    if (direction.length() > 0) {
        direction.normalize().multiplyScalar(moveSpeed);
        camera.position.add(direction);
    }
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in flyKeys) flyKeys[key] = true;

    // Toggle fly camera with F
    if (key === 'f') {
        flyCameraEnabled = !flyCameraEnabled;
        console.log(`Fly camera: ${flyCameraEnabled ? 'ON (WASD+QE move, mouse rotate)' : 'OFF'}`);
    }

    // Log camera position with L
    if (key === 'l') {
        const pos = camera.position;
        const rot = camera.rotation;
        console.log(`camera.position.set(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)});`);
        console.log(`camera.rotation.set(${rot.x.toFixed(4)}, ${rot.y.toFixed(4)}, ${rot.z.toFixed(4)});`);
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in flyKeys) flyKeys[key] = false;
});

window.addEventListener('mousedown', (e) => {
    if (flyCameraEnabled && e.button === 2) {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

window.addEventListener('mousemove', (e) => {
    if (!flyCameraEnabled || !isMouseDown) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    euler.setFromQuaternion(camera.quaternion);
    euler.y -= deltaX * 0.002;
    euler.x -= deltaY * 0.002;
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
    camera.quaternion.setFromEuler(euler);
});

window.addEventListener('contextmenu', (e) => {
    if (flyCameraEnabled) e.preventDefault();
});

// Renderer
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
scene.add(directionalLight);

// Track meshes for collision flash effect
const meshFlashTimers = new Map();

// Flash mesh on collision
function flashMesh(mesh) {
    if (!mesh || !mesh.material) return;

    if (mesh.userData.originalColor === undefined) {
        mesh.userData.originalColor = mesh.material.color.getHex();
    }

    mesh.material.color.setHex(0xffffff);

    if (meshFlashTimers.has(mesh)) {
        clearTimeout(meshFlashTimers.get(mesh));
    }

    const timer = setTimeout(() => {
        mesh.material.color.setHex(mesh.userData.originalColor);
        meshFlashTimers.delete(mesh);
    }, 50);

    meshFlashTimers.set(mesh, timer);
}

// Shared state passed to scenes
const sharedState = {
    scene,
    camera,
    renderer,
    canvas,
    flashMesh
};

// Initialize
let physicsReady = false;
let soundReady = false;
let simulationStarted = false;

async function init() {
    // Initialize physics (but don't start simulation yet)
    await initPhysics();
    physicsReady = true;

    // Load scene based on URL param
    const sceneName = getSceneFromURL();
    await loadScene(sceneName, sharedState);

    console.log(`Scene "${sceneName}" loaded. Click to start simulation.`);
    console.log('Available scenes: ?scene=swing (default), ?scene=pend1, ?scene=sway1, ?scene=falling');

    // Initialize sound AND start physics on first user interaction
    const startSimulation = async () => {
        if (!simulationStarted) {
            simulationStarted = true;
            console.log('Simulation started');
        }
        if (!soundReady) {
            await initSoundSystem();
            soundReady = true;
            console.log('Sound system initialized');
        }
        document.removeEventListener('click', startSimulation);
        document.removeEventListener('keydown', startSimulation);
    };

    document.addEventListener('click', startSimulation);
    document.addEventListener('keydown', startSimulation);

    // Scene click handler
    canvas.addEventListener('click', (event) => {
        if (simulationStarted) {
            onSceneClick(event, sharedState);
        }
    });
}

// Animation loop
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (physicsReady && simulationStarted) {
        // Step physics simulation
        stepPhysics(dt);

        // Get and process collision events
        const collisionEvents = getCollisionEvents();

        if (soundReady) {
            processCollisions(collisionEvents);

            const sounds = getAudibleSounds();
            for (const sound of sounds) {
                playSound(sound.intensity, sound.sounds);
            }
        }

        // Visual feedback for collisions
        for (const event of collisionEvents) {
            if (event.started && event.energy > 0.5) {
                flashMesh(event.mesh1);
                flashMesh(event.mesh2);
            }
        }

        // Update current scene
        updateScene(dt, sharedState);
    }

    renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start
init().then(() => {
    animate();
});
