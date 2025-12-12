import * as THREE from './three.js';
import { GLTFLoader } from './GLTFLoader.js';
// Initialization
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera setup
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

// Light setup
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

// Load the glTF model
const loader = new THREE.GLTFLoader();
loader.load('scene.gltf', (gltf) => {
    scene.add(gltf.scene);
});

// Fetch and apply the exported scene data
fetch('scene_data.json')
    .then(response => response.json())
    .then(data => {
        // Example: setting the camera position and rotation from the JSON data
        if (data.camera_data.length > 0) {
            const cameraData = data.camera_data[0]; // Assuming a single camera for simplicity
            camera.position.set(...cameraData.location);
            camera.rotation.fromArray(cameraData.rotation_euler);
        }

        // Additional object positioning and properties can be applied similarly
    });

// Animation
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start the animation loop
animate();