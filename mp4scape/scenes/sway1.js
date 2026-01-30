// Swing Scene
// A pendulum that swings naturally with physics.
// Click on the bob to push it - pushes opposite to where you click.

import * as THREE from 'three';
import { createBody, createSphericalJoint } from '../physics.js';

let anchorMesh = null;
let bobMesh = null;
let bobBody = null;
let stringLine = null;
let raycaster = null;
let mouse = null;

const PUSH_FORCE = 8; // Impulse strength when clicked

export async function setup(state) {
    const { scene, camera } = state;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Pendulum parameters
    const anchorPosition = { x: 0, y: 6, z: 0 };
    const stringLength = 4;
    const bobSize = 0.8;

    // Create anchor point (small, visible)
    const anchorGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    const anchorMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8
    });
    anchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchorMesh.position.set(anchorPosition.x, anchorPosition.y, anchorPosition.z);
    scene.add(anchorMesh);

    const anchorResult = createBody(anchorMesh, {
        type: 'static',
        shape: 'sphere'
    });

    // Create the swinging bob
    const bobGeometry = new THREE.SphereGeometry(bobSize, 24, 24);
    const bobMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6633,
        roughness: 0.4,
        metalness: 0.3
    });
    bobMesh = new THREE.Mesh(bobGeometry, bobMaterial);
    bobMesh.castShadow = true;
    bobMesh.receiveShadow = true;
    bobMesh.userData.originalColor = 0xff6633;
    bobMesh.userData.isBob = true; // Mark for raycasting

    // Start bob at an angle
    const initialAngle = Math.PI / 5;
    const bobX = anchorPosition.x + Math.sin(initialAngle) * stringLength;
    const bobY = anchorPosition.y - Math.cos(initialAngle) * stringLength;
    bobMesh.position.set(bobX, bobY, anchorPosition.z);
    scene.add(bobMesh);

    const bobResult = createBody(bobMesh, {
        type: 'dynamic',
        shape: 'sphere',
        mass: 3.0,
        restitution: 0.2,
        friction: 0.5
    });

    bobBody = bobResult.body;

    // Add slight damping so it eventually slows down (realistic air resistance)
    bobBody.setLinearDamping(0.1);
    bobBody.setAngularDamping(0.1);

    // Create spherical joint
    createSphericalJoint(
        anchorResult.body,
        bobBody,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: stringLength, z: 0 }
    );

    // Create visual string
    const stringGeometry = new THREE.BufferGeometry();
    const stringMaterial = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,
        linewidth: 2
    });
    stringLine = new THREE.Line(stringGeometry, stringMaterial);
    scene.add(stringLine);

    // Position camera for good view
    state.camera.position.set(0, 4, 12);
    state.camera.lookAt(0, 3, 0);

    console.log('Swing scene: Click on the pendulum to push it!');
}

export function update(dt, state) {
    // Update string visual
    if (anchorMesh && bobMesh && stringLine) {
        const positions = new Float32Array([
            anchorMesh.position.x, anchorMesh.position.y, anchorMesh.position.z,
            bobMesh.position.x, bobMesh.position.y, bobMesh.position.z
        ]);
        stringLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        stringLine.geometry.attributes.position.needsUpdate = true;
    }
}

export function onClick(event, state) {
    const { canvas, camera } = state;

    // Calculate mouse position
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check if we clicked the bob
    const intersects = raycaster.intersectObject(bobMesh);

    if (intersects.length > 0 && bobBody) {
        const hit = intersects[0];
        const hitPoint = hit.point;

        // Calculate direction from hit point to bob center
        const bobCenter = new THREE.Vector3();
        bobMesh.getWorldPosition(bobCenter);

        const pushDirection = new THREE.Vector3()
            .subVectors(bobCenter, hitPoint)
            .normalize();

        // Apply impulse in that direction (push away from click)
        bobBody.applyImpulse(
            {
                x: pushDirection.x * PUSH_FORCE,
                y: pushDirection.y * PUSH_FORCE * 0.5, // Less vertical push
                z: pushDirection.z * PUSH_FORCE
            },
            true // wake up the body
        );

        // Visual feedback
        bobMesh.material.color.setHex(0xffff00);
        setTimeout(() => {
            bobMesh.material.color.setHex(bobMesh.userData.originalColor);
        }, 100);

        console.log(`Pushed! Direction: (${pushDirection.x.toFixed(2)}, ${pushDirection.y.toFixed(2)}, ${pushDirection.z.toFixed(2)})`);
    }
}

export function cleanup(state) {
    const { scene } = state;

    if (anchorMesh) {
        scene.remove(anchorMesh);
        anchorMesh = null;
    }
    if (bobMesh) {
        scene.remove(bobMesh);
        bobMesh = null;
    }
    if (stringLine) {
        scene.remove(stringLine);
        stringLine = null;
    }

    bobBody = null;
    raycaster = null;
    mouse = null;
}
