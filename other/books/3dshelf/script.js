// Configurable constants
const SECTIONS = 6;
const SHELF_WIDTH = 10;
const SHELF_HEIGHT = 8;
const SHELF_DEPTH = 1;
const SHELF_THICKNESS = 0.1;
const SHELF_SPACING = 1.2;

// Other constants
const MIN_BOOK_WIDTH = 0.25;
const MAX_BOOK_WIDTH = 0.4;
const MIN_BOOK_DEPTH = 0.75;
const MAX_BOOK_DEPTH = 1;

var book_meshes = [];
var rigid_bodies = [];

// Variables
let shelfWidthRemaining, shelfHeightRemaining, startX, startY, bookCount, hoveredBook;

// Keyboard controls
const keyboard = {};
// Three.js setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(SHELF_WIDTH / 2, -SHELF_HEIGHT / 2, -SHELF_WIDTH);
camera.rotation.x = Math.PI;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Add directional light (sun-like)
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(SHELF_WIDTH / 2, SHELF_HEIGHT, -SHELF_WIDTH / 2);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = SHELF_WIDTH * 2;
scene.add(sunLight);

// Create shelves, sides, back, and bottom
const shelfMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

function createBookshelfData(books) {
    // Clear existing scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    scene.add(ambientLight);
    scene.add(sunLight);

    // Calculate shelf dimensions based on books
    const totalBookWidth = books.reduce((sum, book) => sum + book.width, 0);
    const maxBookHeight = Math.max(...books.map(book => book.height));
    const maxBookDepth = Math.max(...books.map(book => book.depth));

    const SHELF_THICKNESS = 0.1;
    const SHELF_SPACING = maxBookHeight + SHELF_THICKNESS + 0.1; // Add a small gap
    const BOOKS_PER_SHELF = Math.sqrt(books.length) * 3;
    const SECTIONS = Math.ceil(books.length / BOOKS_PER_SHELF);
    const lastBookWidth = books[books.length - 1].width;
    const SHELF_WIDTH = (Math.max(...books.map(book => book.width)) * BOOKS_PER_SHELF + 2 * SHELF_THICKNESS); // Add a small gap
    const SHELF_HEIGHT = SHELF_SPACING * SECTIONS;
    const SHELF_DEPTH = maxBookDepth + SHELF_THICKNESS;

    return { SHELF_WIDTH, SHELF_HEIGHT, SHELF_DEPTH, SHELF_SPACING, SECTIONS };
}

// Load font
const loader = new THREE.FontLoader();
fetch('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json')
    .then(response => response.json())
    .then(fontJson => {
        const font = new THREE.Font(fontJson);
        start(font);

    });


function randomColor(true_random = false) {
    if (true_random) {
        return Math.floor(Math.random() * 16777215);
    } else {
        const bookColors = [
            0x8B4513, // SaddleBrown
            0xD2691E, // Chocolate
            0xF4A460, // SandyBrown
            0xCD853F, // Peru
            0xD2B48C, // Tan
            0xBC8F8F, // RosyBrown
            0xFFE4C4, // Bisque
            0x5C4033, // DarkBrown
            0x0D0D0D, // OffBlack
            0xFFFFFF, // White
            0x0000FF, // Blue
            0xFF0000, // Red
            0xFFFF00, // Yellow
            0x008000, // Green
            0xFFA500, // Orange
            0x800080, // Purple
            0x00FFFF, // Cyan
            0xFFC0CB  // Pink
        ];

        return bookColors[Math.floor(Math.random() * bookColors.length)];
    }
}

async function start(font) {
    const books = await generateBooks(1000); // Generate 100 books
    // const books = await generateBooks(0, 'https://api.rau.dev/books');

    var { SHELF_WIDTH, SHELF_HEIGHT, SHELF_DEPTH, SHELF_SPACING, SECTIONS } = createBookshelfData(books);

    let startX = SHELF_THICKNESS;
    let startY = 0;
    let shelfWidthRemaining = SHELF_WIDTH - 2 * SHELF_THICKNESS;
    let currentRowBooks = [];

    function positionBooksInRow() {
        const totalBooksWidth = currentRowBooks.reduce((sum, b) => sum + b.width, 0);
        const remainingSpace = SHELF_WIDTH - 2 * SHELF_THICKNESS - totalBooksWidth;
        const spacing = remainingSpace / (currentRowBooks.length + 1);

        let currentX = SHELF_THICKNESS - 0.05; // Minimal spacing
        for (let i = 0; i < currentRowBooks.length; i++) {
            const b = currentRowBooks[i];
            const x = currentX + b.width / 2;
            const y = (-startY - b.height / 2) - 0.05;
            const z = (b.depth / 2) - 1;
            if (b.index % 2 === 0) {

                const textGeometry = new THREE.TextGeometry(b.title || 'Unknown', {
                    font: font,
                    size: 0.5,
                    height: 0.01,
                });

                textGeometry.rotateZ(-Math.PI / 2);
                textGeometry.rotateX(Math.PI);
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

                let _book = addBook(x, y, z, b.width, b.height, b.depth, b.color, null, textGeometry, textMaterial);
                _book.userData = b;
                book_meshes.push(_book);
            }
            currentX += b.width - 0.05; // Minimal spacing
        }

        startX = SHELF_THICKNESS;
        startY += SHELF_SPACING;
        shelfWidthRemaining = SHELF_WIDTH - 2 * SHELF_THICKNESS;
        currentRowBooks = [];
    }

    books.forEach((book, index) => {
        if (book.width > shelfWidthRemaining || (index > 0 && index % Math.ceil(books.length / SECTIONS) === 0)) {
            positionBooksInRow();
        }

        currentRowBooks.push({ ...book, index });
        startX += book.width;
        shelfWidthRemaining -= book.width;
    });

    if (currentRowBooks.length > 0) {
        positionBooksInRow();
    }

    var rightmostBook = 0;
    book_meshes.forEach(box => {
        const bookEnd = box.position.x + box.geometry.parameters.width / 2;
        if (bookEnd > rightmostBook) {
            rightmostBook = bookEnd;
        }
    });

    SHELF_WIDTH = rightmostBook + SHELF_THICKNESS;

    function addShelf(positionY) {
        const shelfGeometry = new THREE.BoxGeometry(SHELF_WIDTH, SHELF_THICKNESS, SHELF_DEPTH);
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(SHELF_WIDTH / 2, positionY, -SHELF_DEPTH / 2);
        shelf.receiveShadow = true;
        shelf.castShadow = true;
        scene.add(shelf);
        rigid_bodies.push(shelf);
    }

    for (let i = 0; i <= SECTIONS; i++) {
        addShelf(-SHELF_HEIGHT + (i * SHELF_SPACING));
    }

    function addSide(positionX) {
        const sideGeometry = new THREE.BoxGeometry(SHELF_THICKNESS, SHELF_HEIGHT, SHELF_DEPTH);
        const side = new THREE.Mesh(sideGeometry, shelfMaterial);
        side.position.set(positionX, -SHELF_HEIGHT / 2, -SHELF_DEPTH / 2);
        side.receiveShadow = true;
        side.castShadow = true;
        scene.add(side);
        rigid_bodies.push(side);
    }

    addSide(0);
    addSide(SHELF_WIDTH);

    const backGeometry = new THREE.BoxGeometry(SHELF_WIDTH / 2, SHELF_HEIGHT, SHELF_THICKNESS);
    const back = new THREE.Mesh(backGeometry, shelfMaterial);
    back.position.set(SHELF_WIDTH / 2, -SHELF_HEIGHT / 2, 0);
    back.receiveShadow = true;
    back.castShadow = true;
    scene.add(back);
    rigid_bodies.push(back);

    camera.position.set(SHELF_WIDTH / 2, -SHELF_HEIGHT / 2, -SHELF_HEIGHT * 1);
    originalCameraPosition = camera.position.clone();
    originalCameraRotation = camera.rotation.clone();

    initPhysics();
    
    book_meshes.slice().reverse().forEach((book, index) => {
        setTimeout(() => {
            scene.add(book);
        }, index * 25);
    });

    animate();
}

async function generateBooks(count = 100, external = false) {
    const books = [];
    const MIN_BOOK_WIDTH = 0.25;
    const MAX_BOOK_WIDTH = 0.3;
    const MIN_BOOK_DEPTH = 0.85;
    const MAX_BOOK_DEPTH = 1;

    externalBooks = [];
    if (external) {
        const response = await fetch(`https://api.rau.dev/books?c=${count}`);
        externalBooks = await response.json();
        count = externalBooks.books.length;
        externalBooks.books.forEach(book => {
            books.push({
                title: book.title,
                url: `https://openlibrary.org${book.url}`,
                cover: book.picture?.url.replace('-S.jpg', '-M.jpg') || 'default.png',
            });
        });
    }

    for (let i = 0; i < count; i++) {
        const height = Math.max(0.5, Math.random() * 0.8 + 0.1);
        let width = (Math.random() * (MAX_BOOK_WIDTH - MIN_BOOK_WIDTH) + MIN_BOOK_WIDTH) - 0.1;
        if (height < 0.75) {
            width *= (height / 0.75);
        }
        if (i % 2 === 0) {
            width = Math.min(0.05 + Math.random() * 0.2, width);
        }
        const depth = (Math.random() * (MAX_BOOK_DEPTH - MIN_BOOK_DEPTH) + MIN_BOOK_DEPTH) - 0.1;
        const color = randomColor();
        const book = books[i] || {};
        books[i] = {
            position: { x: 0, y: 0, z: 0 },
            width,
            height,
            depth,
            color,
            ...book
        };
    }

    return books;
}

function addBook(x, y, z, width, height, depth, color, boxMaterial, textGeometry, textMaterial) {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    boxMaterial = boxMaterial || new THREE.MeshPhongMaterial({ color: color });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(x, y, z);
    box.objType = 'book';
    box.castShadow = true;
    box.receiveShadow = true;

    const text = new THREE.Mesh(textGeometry.clone(), textMaterial);
    text.scale.set(width * 0.5, height / 14, depth);
    text.position.set(-width / 4, -height / 2, -depth / 2 - 0.001);

    box.add(text);

    return box;
}

// Event listeners
window.addEventListener('resize', onWindowResize);
window.addEventListener('keydown', event => keyboard[event.keyCode] = true);
window.addEventListener('keyup', event => keyboard[event.keyCode] = false);
window.addEventListener('mousemove', onMouseMove);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseEvent = null;
let isZooming = false;
let isZoomed = false;
let zoomTarget = null;
let originalCameraPosition = camera.position.clone();
let originalCameraRotation = camera.rotation.clone();
let lastCameraPosition = null;
let lastCameraRotation = null;
let resetLock = false;

function onMouseMove(event) {
    mouseEvent = event;
}

function handleMouseInteraction() {
    if (!mouseEvent || isZooming) return;

    mouse.x = (mouseEvent.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(mouseEvent.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);
    let intersectedBooks = intersects.filter(intersect => intersect.object.objType === 'book');

    if (intersectedBooks.length > 0) {
        const newHoveredBook = intersectedBooks[0].object;
        if (hoveredBook !== newHoveredBook) {
            if (hoveredBook) {
                hoveredBook.material.color.setHex(hoveredBook.material.defaultColor);
            }
            hoveredBook = newHoveredBook;
            hoveredBook.material.defaultColor = hoveredBook.material.color.getHex();
            hoveredBook.material.color.setHex(0x00ff00);
        }
    } else if (hoveredBook) {
        hoveredBook.material.color.setHex(hoveredBook.material.defaultColor);
        hoveredBook = null;
    }
}

window.addEventListener('click', () => {
    if (hoveredBook && !isZooming && !resetLock) {
        zoomToBook(hoveredBook);
    } else if (isZooming) {
        resetZoom();
    }
});
let zoomStartTime = 0;
const zoomDuration = 1000; // milliseconds
function zoomToBook(book) {
    isZooming = true;
    zoomTarget = book;
    lastCameraPosition = camera.position.clone();

    const targetPosition = book.position.clone().add(new THREE.Vector3(0, 0, -2)); // Increased distance

    zoomStartTime = Date.now();
    requestAnimationFrame(animateZoom);
    document.getElementById('back-button').style.display = 'block';
    document.getElementById('modal').style.display = 'block';
    document.getElementById('info-title').innerText = book.title;
    document.getElementById('info-url').innerText = book.url;
    document.getElementById('info-cover').src = book.cover;
    document.getElementById('modal').style.display = 'block';
    document.getElementById('back-button').style.display = 'block';
}

function resetZoom() {
    isZooming = false;
    resetLock = true;
    setTimeout(() => resetLock = false, 250);

    camera.position.copy(originalCameraPosition);
    camera.rotation.copy(originalCameraRotation);

    document.getElementById('back-button').style.display = 'none';
    document.getElementById('modal').style.display = 'none';

}

function animateZoom() {
    const elapsedTime = Date.now() - zoomStartTime;
    const progress = Math.min(elapsedTime / zoomDuration, 1);
    const easeProgress = easeInOutQuad(progress);

    camera.position.lerpVectors(lastCameraPosition, zoomTarget.position.clone().add(new THREE.Vector3(0, 0, -2)), easeProgress);

    if (progress < 1) {
        requestAnimationFrame(animateZoom);
    } else {
        isZooming = false;
    }
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function moveCamera() {
    if (keyboard[87]) camera.position.z += 0.1; // W
    if (keyboard[83]) camera.position.z -= 0.1; // S
    if (keyboard[65]) camera.position.x -= 0.1; // A
    if (keyboard[68]) camera.position.x += 0.1; // D
    if (keyboard[81]) camera.rotation.y += 0.05; // Q
    if (keyboard[69]) camera.rotation.y -= 0.05; // E
    if (keyboard[32]) camera.position.y += 0.1; // Space
    if (keyboard[16]) camera.position.y -= 0.1; // Shift
}
let world, physicsBodies = [];

// In your start function, after creating Three.js objects:
function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, 9.82, 0); // Set gravity to make books fall

    // Convert book meshes to physics bodies
    book_meshes.forEach(box => {
        const { width, height, depth } = box.geometry.parameters;
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(box.position.x, box.position.y, box.position.z),
            material: new CANNON.Material({ friction: 0.5, restitution: 0.1 }) // Adjust friction and restitution
        });

        // small impulse to make books fall
        body.applyLocalImpulse(new CANNON.Vec3((Math.random() - 0.5) * 10, 0, 0), new CANNON.Vec3(0, 0, 0));

        world.addBody(body);
        physicsBodies.push({ mesh: box, body: body });
    });

    // Add static bodies for shelves
    rigid_bodies.forEach(mesh => {
        const { width, height, depth } = mesh.geometry.parameters;
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const shelfBody = new CANNON.Body({
            mass: 0,
            shape: shape,
            position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
            material: new CANNON.Material({ friction: 0.5, restitution: 0.1 }) // Adjust friction and restitution
        });

        world.addBody(shelfBody);
    });
}

// Call initPhysics() after creating Three.js objects

// Update your animate function
let stopPhysics = false;
setTimeout(() => { stopPhysics = true; }, 5000);

function animate() {
    requestAnimationFrame(animate);
    if (world && !stopPhysics) {
        world.step(1 / 60);
    }

    // Update Three.js meshes
    physicsBodies.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    });

    moveCamera();
    handleMouseInteraction();
    renderer.render(scene, camera);
}

// function animate() {
//     requestAnimationFrame(animate);
//     moveCamera();
//     handleMouseInteraction();
//     renderer.render(scene, camera);
// }

document.getElementById('back-button').addEventListener('click', resetZoom);
