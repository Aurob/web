// Scene Loader - manages different scene configurations
// URL param: ?scene=name (default: 'swing')

const scenes = new Map();
let currentScene = null;
let sharedState = null;

export function registerScene(name, sceneModule) {
    scenes.set(name, sceneModule);
}

export function getSceneFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('scene') || 'swing'; // Default to swing
}

export async function loadScene(name, state) {
    sharedState = state;

    const sceneModule = scenes.get(name);
    if (!sceneModule) {
        console.error(`Scene "${name}" not found. Available: ${[...scenes.keys()].join(', ')}`);
        return false;
    }

    // Cleanup previous scene if exists
    if (currentScene && currentScene.cleanup) {
        currentScene.cleanup(state);
    }

    currentScene = sceneModule;

    // Initialize new scene
    if (sceneModule.setup) {
        await sceneModule.setup(state);
    }

    console.log(`Loaded scene: ${name}`);
    return true;
}

export function updateScene(dt, state) {
    if (currentScene && currentScene.update) {
        currentScene.update(dt, state);
    }
}

export function onSceneClick(event, state) {
    if (currentScene && currentScene.onClick) {
        currentScene.onClick(event, state);
    }
}

export function getCurrentSceneName() {
    for (const [name, module] of scenes) {
        if (module === currentScene) return name;
    }
    return null;
}
