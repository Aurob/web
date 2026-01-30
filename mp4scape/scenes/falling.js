// Falling Objects Scene
// Objects fall from above and bounce. Click to spawn more.

import * as THREE from 'three';
import { createBody } from '../physics.js';

let ground = null;
const fallingObjects = [];

export async function setup(state) {
    const { scene } = state;

    // Create ground plane
    const groundGeometry = new THREE.BoxGeometry(20, 1, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -3;
    ground.receiveShadow = true;
    scene.add(ground);

    createBody(ground, {
        type: 'static',
        restitution: 0.6,
        friction: 0.5
    });

    // Spawn initial objects
    for (let i = 0; i < 8; i++) {
        spawnFallingObject(state);
    }

    console.log('Falling scene: Click anywhere to spawn more objects');
}

function spawnFallingObject(state) {
    const { scene } = state;

    const isBox = Math.random() > 0.5;
    const size = 0.5 + Math.random() * 1.0;
    const colors = [0x4488ff, 0xff4444, 0x44ff44, 0xffff44, 0xff44ff, 0x44ffff];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let geometry;
    let shape;

    if (isBox) {
        geometry = new THREE.BoxGeometry(size, size, size);
        shape = 'box';
    } else {
        geometry = new THREE.SphereGeometry(size / 2, 16, 16);
        shape = 'sphere';
    }

    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.originalColor = color;

    // Random starting position above the scene
    mesh.position.set(
        (Math.random() - 0.5) * 8,
        5 + Math.random() * 5,
        (Math.random() - 0.5) * 8
    );

    mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    scene.add(mesh);

    createBody(mesh, {
        type: 'dynamic',
        shape: shape,
        restitution: 0.5 + Math.random() * 0.4,
        friction: 0.3,
        mass: size * size * size,
        collisionResponse: 'bounce'
    });

    fallingObjects.push(mesh);

    return mesh;
}

export function update(dt, state) {
    // No special per-frame updates needed
}

export function onClick(event, state) {
    // Spawn a new falling object on click
    spawnFallingObject(state);
}

export function cleanup(state) {
    const { scene } = state;

    // Remove ground
    if (ground) {
        scene.remove(ground);
        ground = null;
    }

    // Remove all falling objects
    for (const obj of fallingObjects) {
        scene.remove(obj);
    }
    fallingObjects.length = 0;
}
