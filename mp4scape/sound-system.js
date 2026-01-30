// Sound System - Per-Object Sounds with Collision Blending
// Each object has its own sound. Collisions blend both objects' sounds.

let audioContext = null;
let masterGain = null;
let compressor = null;

// Named sound buffers
const soundBuffers = new Map();  // 'thump' -> AudioBuffer, 'ding' -> AudioBuffer

// Active voice tracking for polyphony limit
const activeVoices = [];
const MAX_VOICES = 8;  // Limit concurrent sounds (helps mobile)

// Accumulator state
let accumulatedEnergy = 0;
let energyHistory = [];
const TIME_WINDOW_MS = 50;
let audibilityThreshold = 0.10;
let lastAudibleTime = 0;

// Detect mobile for adjusted settings
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const MIN_SOUND_INTERVAL_MS = isMobile ? 80 : 30;  // Longer interval on mobile

const pendingSounds = [];

export async function initSoundSystem() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create master gain
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.8;

    // Create compressor to prevent clipping and smooth out volume spikes
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Chain: voices -> masterGain -> compressor -> destination
    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);

    // Load both sound types
    await Promise.all([
        loadSound('thump', 'sounds/thump.mp3', createSyntheticThump),
        loadSound('ding', 'sounds/ding.mp3', createSyntheticDing)
    ]);

    console.log(`Sound system initialized (mobile: ${isMobile}, maxVoices: ${MAX_VOICES})`);
    return audioContext;
}

async function loadSound(name, path, fallbackGenerator) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`${path} not found`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        soundBuffers.set(name, buffer);
        console.log(`Loaded sound: ${name} from ${path}`);
    } catch (error) {
        console.log(`${path} not found, using synthetic ${name}`);
        soundBuffers.set(name, fallbackGenerator());
    }
}

// Synthetic thump - low, percussive (for bobs)
function createSyntheticThump() {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.25;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 18);
        const frequency = 70 - (t * 50);
        const sample = Math.sin(2 * Math.PI * frequency * t);
        const noise = (Math.random() * 2 - 1) * 0.15;
        data[i] = (sample * 0.7 + noise) * envelope * 0.5;
    }

    return buffer;
}

// Synthetic ding - higher, metallic (for walls)
function createSyntheticDing() {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.4;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 8);
        // Higher frequencies with harmonics for metallic sound
        const f1 = 800;
        const f2 = 1200;
        const f3 = 1600;
        const sample = Math.sin(2 * Math.PI * f1 * t) * 0.5 +
                      Math.sin(2 * Math.PI * f2 * t) * 0.3 +
                      Math.sin(2 * Math.PI * f3 * t) * 0.2;
        data[i] = sample * envelope * 0.35;
    }

    return buffer;
}

// Clean up finished voices
function cleanupVoices() {
    const now = audioContext.currentTime;
    for (let i = activeVoices.length - 1; i >= 0; i--) {
        if (activeVoices[i].endTime < now) {
            activeVoices.splice(i, 1);
        }
    }
}

// Stop oldest voice if at limit
function makeRoomForVoice() {
    cleanupVoices();
    if (activeVoices.length >= MAX_VOICES) {
        const oldest = activeVoices.shift();
        if (oldest && oldest.source) {
            try {
                oldest.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.02);
                oldest.source.stop(audioContext.currentTime + 0.025);
            } catch (e) {
                // Already stopped
            }
        }
    }
}

export function processCollisions(events) {
    const now = performance.now();

    energyHistory = energyHistory.filter(e => (now - e.time) < TIME_WINDOW_MS);

    for (const event of events) {
        if (!event.started) continue;

        // Get sounds from colliding objects
        const sound1 = event.mesh1?.userData?.sound || 'thump';
        const sound2 = event.mesh2?.userData?.sound || 'thump';

        energyHistory.push({
            time: now,
            energy: event.energy,
            contactPoint: event.contactPoint,
            sounds: [sound1, sound2]  // Track which sounds to blend
        });
    }

    accumulatedEnergy = energyHistory.reduce((sum, e) => sum + e.energy, 0);

    if (accumulatedEnergy > audibilityThreshold) {
        const timeSinceLastSound = now - lastAudibleTime;

        if (timeSinceLastSound > MIN_SOUND_INTERVAL_MS) {
            // Collect all unique sounds from recent collisions
            const soundsToPlay = new Set();
            let dominantPoint = { x: 0, y: 0, z: 0 };
            let maxEnergy = 0;

            for (const e of energyHistory) {
                if (e.sounds) {
                    e.sounds.forEach(s => soundsToPlay.add(s));
                }
                if (e.energy > maxEnergy) {
                    maxEnergy = e.energy;
                    dominantPoint = e.contactPoint;
                }
            }

            pendingSounds.push({
                intensity: Math.min(accumulatedEnergy / audibilityThreshold, 3.0),
                position: dominantPoint,
                sounds: [...soundsToPlay]  // Array of sound names to blend
            });

            lastAudibleTime = now;
            energyHistory = [];
            accumulatedEnergy = 0;
        }
    }
}

export function getAudibleSounds() {
    const sounds = [...pendingSounds];
    pendingSounds.length = 0;
    return sounds;
}

// Play blended sounds
export function playSound(intensity = 1.0, soundNames = ['thump']) {
    if (!audioContext || !masterGain) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const now = audioContext.currentTime;
    const baseVolume = Math.min(intensity * 0.35, 0.7);

    // On mobile, only play one sound per collision to reduce load
    const namesToPlay = isMobile ? [soundNames[0]] : soundNames;
    const volumePerSound = baseVolume / Math.sqrt(namesToPlay.length);

    for (const soundName of namesToPlay) {
        const buffer = soundBuffers.get(soundName);
        if (!buffer) continue;

        // Make room if at voice limit
        makeRoomForVoice();

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();

        // Reduced variation for cleaner sound on mobile
        const variation = isMobile ? 0.5 : 1.0;
        const attack = 0.005 + Math.random() * 0.005 * variation;
        const release = 0.08 + Math.random() * 0.05 * variation;

        const playbackRate = 0.9 + Math.random() * 0.2 * variation + (intensity * 0.03);
        source.playbackRate.value = playbackRate;
        const duration = buffer.duration / playbackRate;

        // Smoother envelope using exponential ramps (less clicks than linear)
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(volumePerSound, now + attack);

        const releaseStart = now + Math.max(duration - release, attack + 0.01);
        gainNode.gain.setValueAtTime(volumePerSound, releaseStart);
        gainNode.gain.exponentialRampToValueAtTime(0.001, releaseStart + release);

        source.connect(gainNode);
        gainNode.connect(masterGain);

        const endTime = now + duration + 0.1;
        activeVoices.push({ source, gainNode, endTime });

        source.start(0);
        source.stop(endTime);
    }
}

// Helper to assign sound to a mesh
export function assignSound(mesh, soundName) {
    if (mesh && mesh.userData) {
        mesh.userData.sound = soundName;
    }
}

export function setAudibilityThreshold(value) {
    audibilityThreshold = value;
}

export function getAudibilityThreshold() {
    return audibilityThreshold;
}

export function getAccumulatedEnergy() {
    return accumulatedEnergy;
}

export function getEnergyRatio() {
    return accumulatedEnergy / audibilityThreshold;
}
