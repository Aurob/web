// Swing Scene (with walls)
// A pendulum that swings between two walls.
// Walls add energy on collision for perpetual motion.

import * as THREE from 'three';
import { createBody, createSphericalJoint } from '../physics.js';

let anchorMesh = null;
let bobMesh = null;
let bobBody = null;
let stringLine = null;
let leftWall = null;
let rightWall = null;
let raycaster = null;
let mouse = null;
let needsInitialPush = true;  // Apply impulse on first update

// ===========================================
// CONFIGURATION - adjust these values easily
// ===========================================
const CONFIG = {
    // Force applied when user clicks
    pushForce: 12,

    // Force walls apply AFTER collision to maintain perpetual motion
    wallBoostForce: 8,

    // Initial impulse to start swinging
    initialImpulse: 35,

    // Wall positions (inner face x-coordinate)
    wallX: 4.2,

    // Bob properties
    bobRadius: 0.7,
    stringLength: 6,

    // Damping (lower = less energy loss)
    linearDamping: 0.002,
    angularDamping: 0.002,
};

// Push mode: true = simple left/right based on click position, false = 3D directional
let simplePushMode = true;

export async function setup(state) {
    const { scene, camera } = state;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    needsInitialPush = true;

    // Pendulum parameters
    const anchorPosition = { x: 0, y: 7, z: 0 };
    const stringLength = CONFIG.stringLength;
    const bobSize = CONFIG.bobRadius;

    // Create walls (slightly thicker to help prevent tunneling)
    const wallGeometry = new THREE.BoxGeometry(0.3, 8, 6);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        roughness: 0.6,
        metalness: 0.3
    });

    // Left wall
    leftWall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
    leftWall.position.set(-CONFIG.wallX - 0.15, 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    leftWall.userData.originalColor = 0x4466aa;
    leftWall.userData.isWall = true;
    leftWall.userData.sound = 'ding';
    scene.add(leftWall);

    createBody(leftWall, {
        type: 'static',
        shape: 'box',
        restitution: 0.9,
        friction: 0.05
    });

    // Right wall
    rightWall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
    rightWall.position.set(CONFIG.wallX + 0.15, 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    rightWall.userData.originalColor = 0x4466aa;
    rightWall.userData.isWall = true;
    rightWall.userData.sound = 'ding';
    scene.add(rightWall);

    createBody(rightWall, {
        type: 'static',
        shape: 'box',
        restitution: 0.9,
        friction: 0.05
    });

    // Create anchor point
    const anchorGeometry = new THREE.SphereGeometry(0.12, 12, 12);
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
    bobMesh.userData.isBob = true;
    bobMesh.userData.sound = 'thump';

    // Start bob at moderate angle (not past wall)
    const initialAngle = Math.PI / 6;  // 30 degrees - safe starting position
    const bobX = anchorPosition.x + Math.sin(initialAngle) * stringLength;
    const bobY = anchorPosition.y - Math.cos(initialAngle) * stringLength;
    bobMesh.position.set(bobX, bobY, anchorPosition.z);
    scene.add(bobMesh);

    const bobResult = createBody(bobMesh, {
        type: 'dynamic',
        shape: 'sphere',
        mass: 2.0,
        restitution: 0.85,
        friction: 0.05,
        ccd: true  // Prevent tunneling through walls
    });

    bobBody = bobResult.body;

    // Very minimal damping
    bobBody.setLinearDamping(CONFIG.linearDamping);
    bobBody.setAngularDamping(CONFIG.angularDamping);

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

    // Position camera
    state.camera.position.set(0, 3, 16);
    state.camera.lookAt(0, 2, 0);

    console.log('Swing scene: Pendulum bounces between walls.');
    console.log('Click anywhere to push (simple mode). Press M to toggle 3D push mode.');
}

export function update(dt, state) {
    // Apply initial impulse on first frame to get bob moving toward wall
    if (needsInitialPush && bobBody) {
        bobBody.applyImpulse({ x: CONFIG.initialImpulse, y: 0, z: 0 }, true);
        needsInitialPush = false;
    }

    // Update string visual
    if (anchorMesh && bobMesh && stringLine) {
        const positions = new Float32Array([
            anchorMesh.position.x, anchorMesh.position.y, anchorMesh.position.z,
            bobMesh.position.x, bobMesh.position.y, bobMesh.position.z
        ]);
        stringLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        stringLine.geometry.attributes.position.needsUpdate = true;
    }

    // Wall boost: apply extra force AFTER bob bounces off wall (moving away)
    // This adds energy to compensate for collision losses
    if (bobBody && bobMesh) {
        const bobX = bobMesh.position.x;
        const vel = bobBody.linvel();
        const { bobRadius, wallX, wallBoostForce } = CONFIG;

        // Contact zone - very small, only when actually touching wall
        const contactZone = 0.15;
        const leftWallContact = -wallX + bobRadius;
        const rightWallContact = wallX - bobRadius;

        // Near left wall AND moving away (just bounced) - boost it
        if (bobX < leftWallContact + contactZone && vel.x > 0.5) {
            bobBody.applyImpulse({ x: wallBoostForce, y: 0, z: 0 }, true);
        }

        // Near right wall AND moving away (just bounced) - boost it
        if (bobX > rightWallContact - contactZone && vel.x < -0.5) {
            bobBody.applyImpulse({ x: -wallBoostForce, y: 0, z: 0 }, true);
        }
    }
}

export function onClick(event, state) {
    if (!bobBody || !bobMesh) return;

    const { canvas, camera } = state;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (simplePushMode) {
        // Simple mode: click left of center = push left, click right = push right
        const pushDirection = mouse.x > 0 ? 1 : -1;
        bobBody.applyImpulse({ x: pushDirection * CONFIG.pushForce, y: 0, z: 0 }, true);

        bobMesh.material.color.setHex(0xffff00);
        setTimeout(() => {
            bobMesh.material.color.setHex(bobMesh.userData.originalColor);
        }, 100);
    } else {
        // 3D mode: raycast to bob, push away from click point
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(bobMesh);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const hitPoint = hit.point;

            const bobCenter = new THREE.Vector3();
            bobMesh.getWorldPosition(bobCenter);

            const pushDirection = new THREE.Vector3()
                .subVectors(bobCenter, hitPoint)
                .normalize();

            bobBody.applyImpulse(
                {
                    x: pushDirection.x * CONFIG.pushForce,
                    y: pushDirection.y * CONFIG.pushForce * 0.2,
                    z: pushDirection.z * CONFIG.pushForce
                },
                true
            );

            bobMesh.material.color.setHex(0xffff00);
            setTimeout(() => {
                bobMesh.material.color.setHex(bobMesh.userData.originalColor);
            }, 100);
        }
    }
}

// Toggle push mode with M key
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            simplePushMode = !simplePushMode;
            console.log(`Push mode: ${simplePushMode ? 'Simple (left/right)' : '3D directional'}`);
        }
    });
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
    if (leftWall) {
        scene.remove(leftWall);
        leftWall = null;
    }
    if (rightWall) {
        scene.remove(rightWall);
        rightWall = null;
    }

    bobBody = null;
    raycaster = null;
    mouse = null;
    needsInitialPush = true;
}
