// Swing Scene - 5x5 Grid of Pendulums
// 25 pendulums swinging at different rates creating chaotic sound

import * as THREE from 'three';
import { createBody, createSphericalJoint } from '../physics.js';

// All pendulum units
const units = [];

// Grid configuration
const GRID_SIZE = 5;
const GRID_SPACING = 12;  // Distance between unit centers

// Create a single pendulum unit at position (centerX, centerZ)
function createPendulumUnit(scene, centerX, centerZ, config) {
    const {
        stringLength,
        bobRadius,
        mass,
        initialImpulse,
        initialDirection,
        wallBoostForce,
        wallX,
        bobColor
    } = config;

    const anchorY = 7;
    const unit = {
        config,
        needsInitialPush: true
    };

    // Create walls
    const wallGeometry = new THREE.BoxGeometry(0.3, 8, 6);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        roughness: 0.6,
        metalness: 0.3
    });

    // Left wall
    unit.leftWall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
    unit.leftWall.position.set(centerX - wallX - 0.15, 2, centerZ);
    unit.leftWall.receiveShadow = true;
    unit.leftWall.userData.originalColor = 0x4466aa;
    unit.leftWall.userData.sound = 'ding';  // Walls make ding sound
    scene.add(unit.leftWall);

    createBody(unit.leftWall, {
        type: 'static',
        shape: 'box',
        restitution: 0.9,
        friction: 0.05
    });

    // Right wall
    unit.rightWall = new THREE.Mesh(wallGeometry, wallMaterial.clone());
    unit.rightWall.position.set(centerX + wallX + 0.15, 2, centerZ);
    unit.rightWall.receiveShadow = true;
    unit.rightWall.userData.originalColor = 0x4466aa;
    unit.rightWall.userData.sound = 'ding';  // Walls make ding sound
    scene.add(unit.rightWall);

    createBody(unit.rightWall, {
        type: 'static',
        shape: 'box',
        restitution: 0.9,
        friction: 0.05
    });

    // Anchor point
    const anchorGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const anchorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    unit.anchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
    unit.anchorMesh.position.set(centerX, anchorY, centerZ);
    scene.add(unit.anchorMesh);

    const anchorResult = createBody(unit.anchorMesh, {
        type: 'static',
        shape: 'sphere'
    });

    // Bob
    const bobGeometry = new THREE.SphereGeometry(bobRadius, 16, 16);
    const bobMaterial = new THREE.MeshStandardMaterial({
        color: bobColor,
        roughness: 0.4,
        metalness: 0.3
    });
    unit.bobMesh = new THREE.Mesh(bobGeometry, bobMaterial);
    unit.bobMesh.castShadow = true;
    unit.bobMesh.userData.originalColor = bobColor;
    unit.bobMesh.userData.sound = 'thump';  // Bobs make thump sound

    // Start at slight angle
    const initialAngle = Math.PI / 6;
    const bobX = centerX + Math.sin(initialAngle) * stringLength * initialDirection;
    const bobY = anchorY - Math.cos(initialAngle) * stringLength;
    unit.bobMesh.position.set(bobX, bobY, centerZ);
    scene.add(unit.bobMesh);

    const bobResult = createBody(unit.bobMesh, {
        type: 'dynamic',
        shape: 'sphere',
        mass: mass,
        restitution: 0.85,
        friction: 0.05,
        ccd: true
    });

    unit.bobBody = bobResult.body;
    unit.bobBody.setLinearDamping(0.002);
    unit.bobBody.setAngularDamping(0.002);

    // Joint
    createSphericalJoint(
        anchorResult.body,
        unit.bobBody,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: stringLength, z: 0 }
    );

    // String visual
    const stringGeometry = new THREE.BufferGeometry();
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    unit.stringLine = new THREE.Line(stringGeometry, stringMaterial);
    scene.add(unit.stringLine);

    // Store center position for wall boost calculations
    unit.centerX = centerX;

    return unit;
}

// Update a single unit
function updateUnit(unit, dt) {
    const { bobBody, bobMesh, anchorMesh, stringLine, config, centerX } = unit;

    // Apply initial impulse
    if (unit.needsInitialPush && bobBody) {
        bobBody.applyImpulse({
            x: config.initialImpulse * config.initialDirection,
            y: 0,
            z: 0
        }, true);
        unit.needsInitialPush = false;
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

    // Wall boost
    if (bobBody && bobMesh) {
        const bobX = bobMesh.position.x;
        const vel = bobBody.linvel();
        const { bobRadius, wallX, wallBoostForce } = config;

        const contactZone = 0.15;
        const leftWallContact = centerX - wallX + bobRadius;
        const rightWallContact = centerX + wallX - bobRadius;

        // Near left wall and moving away
        if (bobX < leftWallContact + contactZone && vel.x > 0.5) {
            bobBody.applyImpulse({ x: wallBoostForce, y: 0, z: 0 }, true);
        }

        // Near right wall and moving away
        if (bobX > rightWallContact - contactZone && vel.x < -0.5) {
            bobBody.applyImpulse({ x: -wallBoostForce, y: 0, z: 0 }, true);
        }
    }
}

export async function setup(state) {
    const { scene, camera } = state;

    // Random bob colors
    const colors = [0xff6633, 0x33ff66, 0x6633ff, 0xff3366, 0x66ff33, 0x3366ff, 0xffff33, 0xff33ff, 0x33ffff];

    // Create 5x5 grid
    const offset = (GRID_SIZE - 1) * GRID_SPACING / 2;

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const centerX = col * GRID_SPACING - offset;
            const centerZ = row * GRID_SPACING - offset;

            // Randomize parameters for chaos
            const config = {
                stringLength: 5 + Math.random() * 2,        // 5-7
                bobRadius: 0.5 + Math.random() * 0.4,       // 0.5-0.9
                mass: 1.5 + Math.random() * 1.0,            // 1.5-2.5
                initialImpulse: 30 + Math.random() * 10,    // 30-40
                initialDirection: Math.random() > 0.5 ? 1 : -1,
                wallBoostForce: 6 + Math.random() * 4,      // 6-10
                wallX: 4.2,
                bobColor: colors[Math.floor(Math.random() * colors.length)]
            };

            const unit = createPendulumUnit(scene, centerX, centerZ, config);
            units.push(unit);
        }
    }

    // Position camera
    camera.position.set(2.96, -42.90, 5.45);
    camera.rotation.set(1.4828, 0.0008, -0.0091);

    console.log(`Swing grid: ${GRID_SIZE}x${GRID_SIZE} = ${units.length} pendulums`);
}

export function update(dt, state) {
    for (const unit of units) {
        updateUnit(unit, dt);
    }
}

export function onClick(event, state) {
    // No interaction for this scene - just observe
}

export function cleanup(state) {
    const { scene } = state;

    for (const unit of units) {
        if (unit.leftWall) scene.remove(unit.leftWall);
        if (unit.rightWall) scene.remove(unit.rightWall);
        if (unit.anchorMesh) scene.remove(unit.anchorMesh);
        if (unit.bobMesh) scene.remove(unit.bobMesh);
        if (unit.stringLine) scene.remove(unit.stringLine);
    }

    units.length = 0;
}
