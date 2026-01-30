import RAPIER from '@dimforge/rapier3d-compat';

let world = null;
let eventQueue = null;
const bodies = new Map(); // Map<rigidBodyHandle, {mesh, body, collider}>

export async function initPhysics() {
    await RAPIER.init();

    // Create world with gravity
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    world = new RAPIER.World(gravity);

    // Event queue for collision detection
    eventQueue = new RAPIER.EventQueue(true);

    return world;
}

export function createBody(mesh, options = {}) {
    const {
        type = 'dynamic',
        collisionResponse = 'bounce', // 'bounce' or 'noclip'
        restitution = 0.5,
        friction = 0.5,
        mass = 1.0,
        shape = 'box', // 'box' or 'sphere'
        ccd = false // Continuous Collision Detection - prevents tunneling through thin walls
    } = options;

    // Create rigid body description
    let bodyDesc;
    if (type === 'static') {
        bodyDesc = RAPIER.RigidBodyDesc.fixed();
    } else {
        bodyDesc = RAPIER.RigidBodyDesc.dynamic();
        if (ccd) {
            bodyDesc.setCcdEnabled(true);
        }
    }

    // Set position from mesh
    bodyDesc.setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
    bodyDesc.setRotation({
        x: mesh.quaternion.x,
        y: mesh.quaternion.y,
        z: mesh.quaternion.z,
        w: mesh.quaternion.w
    });

    const body = world.createRigidBody(bodyDesc);

    // Create collider based on mesh geometry
    let colliderDesc;

    if (shape === 'sphere') {
        // Get radius from geometry
        const geometry = mesh.geometry;
        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere.radius;
        colliderDesc = RAPIER.ColliderDesc.ball(radius);
    } else {
        // Default to box - get dimensions from bounding box
        const geometry = mesh.geometry;
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const halfExtents = {
            x: (bbox.max.x - bbox.min.x) / 2,
            y: (bbox.max.y - bbox.min.y) / 2,
            z: (bbox.max.z - bbox.min.z) / 2
        };
        colliderDesc = RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
    }

    // Set physical properties
    colliderDesc.setRestitution(restitution);
    colliderDesc.setFriction(friction);

    // Set mass for dynamic bodies
    if (type === 'dynamic') {
        colliderDesc.setMass(mass);
    }

    // For noclip/sensor mode - detect collisions but don't respond physically
    if (collisionResponse === 'noclip') {
        colliderDesc.setSensor(true);
    }

    // Enable collision events
    colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    const collider = world.createCollider(colliderDesc, body);

    // Store reference for sync and collision lookup
    const handle = body.handle;
    bodies.set(handle, { mesh, body, collider, options });

    // Store handle on mesh for reverse lookup
    mesh.userData.physicsHandle = handle;

    return { body, collider, handle };
}

export function removeBody(handle) {
    const entry = bodies.get(handle);
    if (entry) {
        world.removeRigidBody(entry.body);
        bodies.delete(handle);
    }
}

export function stepPhysics(dt) {
    if (!world) return;

    // Step the simulation
    world.step(eventQueue);

    // Sync Three.js meshes with physics bodies
    for (const [handle, { mesh, body }] of bodies) {
        const position = body.translation();
        const rotation = body.rotation();

        mesh.position.set(position.x, position.y, position.z);
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
}

export function getCollisionEvents() {
    const events = [];

    if (!eventQueue) return events;

    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
        // Get the colliders
        const collider1 = world.getCollider(handle1);
        const collider2 = world.getCollider(handle2);

        if (!collider1 || !collider2) return;

        // Get parent rigid bodies
        const body1 = collider1.parent();
        const body2 = collider2.parent();

        if (!body1 || !body2) return;

        // Get mesh references
        const entry1 = bodies.get(body1.handle);
        const entry2 = bodies.get(body2.handle);

        if (!entry1 || !entry2) return;

        // Calculate collision energy from relative velocity
        const vel1 = body1.linvel();
        const vel2 = body2.linvel();
        const relativeVelocity = Math.sqrt(
            Math.pow(vel1.x - vel2.x, 2) +
            Math.pow(vel1.y - vel2.y, 2) +
            Math.pow(vel1.z - vel2.z, 2)
        );

        // Get masses (static bodies have "infinite" mass conceptually)
        const mass1 = body1.mass() || 1000;
        const mass2 = body2.mass() || 1000;
        const reducedMass = (mass1 * mass2) / (mass1 + mass2);

        // Energy approximation: 0.5 * reduced_mass * relative_velocity^2
        const energy = 0.5 * reducedMass * relativeVelocity * relativeVelocity;

        // Get collision point (midpoint between body centers as approximation)
        const pos1 = body1.translation();
        const pos2 = body2.translation();
        const contactPoint = {
            x: (pos1.x + pos2.x) / 2,
            y: (pos1.y + pos2.y) / 2,
            z: (pos1.z + pos2.z) / 2
        };

        events.push({
            started, // true = collision start, false = collision end
            energy,
            relativeVelocity,
            contactPoint,
            mesh1: entry1.mesh,
            mesh2: entry2.mesh,
            handle1: body1.handle,
            handle2: body2.handle
        });
    });

    return events;
}

export function getBodyByHandle(handle) {
    return bodies.get(handle);
}

export function setGravity(x, y, z) {
    if (world) {
        world.gravity = { x, y, z };
    }
}

// Create a spherical joint (ball joint) between two bodies
// This allows the child to swing freely around the anchor point
export function createSphericalJoint(parentBody, childBody, anchorOnParent, anchorOnChild) {
    const jointData = RAPIER.JointData.spherical(
        anchorOnParent,  // Anchor point relative to parent body
        anchorOnChild    // Anchor point relative to child body
    );

    return world.createImpulseJoint(jointData, parentBody, childBody, true);
}
