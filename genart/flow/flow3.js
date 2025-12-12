let canvas, ctx;
let redraw;
let cgrid = [];
let width = 500;
let height = 500;
let resolution = 0.05;
let cellSize = width * resolution;
let noAngleMode = false;

function loadCGrid(imageData = null) {
    for (let x = 0; x < width / cellSize; x++) {
        cgrid[x] = [];
        for (let y = 0; y < width / cellSize; y++) {
            let rgb;
            if (imageData) {
                let r = imageData.imgdata[parseInt(x * cellSize) * 4 + parseInt(y * cellSize) * imageData.size[0] * 4];
                let g = imageData.imgdata[parseInt(x * cellSize) * 4 + parseInt(y * cellSize) * imageData.size[0] * 4 + 1];
                let b = imageData.imgdata[parseInt(x * cellSize) * 4 + parseInt(y * cellSize) * imageData.size[0] * 4 + 2];
                rgb = `rgb(${r}, ${g}, ${b})`;
            } else {
                let rnx = noise.perlin3(x * 0.01, y * 0.01, 0 + performance.now());
                let rny = noise.perlin3(x * 0.01, y * 0.01, 1 + performance.now());
                let gnx = noise.perlin3(x * 0.01, y * 0.01, 2 + performance.now());
                let gny = noise.perlin3(x * 0.01, y * 0.01, 3 + performance.now());
                let bnx = noise.perlin3(x * 0.01, y * 0.01, 4 + performance.now());
                let bny = noise.perlin3(x * 0.01, y * 0.01, 5 + performance.now());
                rgb = `rgb(${noise.perlin2(x * rnx, y * rny) * 255}, ${noise.perlin2(x * gnx, y * gny) * 255}, ${noise.perlin2(x * bnx, y * bny) * 255})`;
            }

            cgrid[x][y] = {
                x: x,
                y: y,
                angle: noise.perlin2(x * 0.01, y * 0.01) * 360,
                rgb: rgb,
                angleDelta: Math.random() * 4 - 2
            };
        }
    }
}

function setup(image_path = null) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    createSlider();

    if (image_path) {
        image_load(image_path)
            .then((img) => {
                pixelateImage(img)
                    .then((originalImageData) => {
                        window.originalImageData = originalImageData;
                        loadCGrid(originalImageData);
                        redraw = true;
                        draw();
                    });
            });
    } else {
        loadCGrid();
        redraw = true;
        draw();
    }
}

function draw() {
    if (redraw) {
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, width, height);

        cgrid.forEach((row, x) => {
            row.forEach((col, y) => {
                let x1 = col.x * cellSize;
                let y1 = col.y * cellSize;

                ctx.save();
                ctx.translate(x1 + cellSize / 2, y1 + cellSize / 2);
                ctx.rotate((noAngleMode ? 0 : col.angle) * Math.PI / 180);
                ctx.fillStyle = col.rgb;
                ctx.fillRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
                ctx.restore();
            });
        });

        redraw = false;
    }
}

function update() {
    cgrid.forEach((row, x) => {
        row.forEach((col, y) => {
            col.angle += col.angleDelta;
        });
    });
    redraw = true;
    draw();
    requestAnimationFrame(update);
}

function createSlider() {
    let slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0.01;
    slider.max = 0.1;
    slider.step = 0.01;
    slider.value = resolution;
    document.body.appendChild(slider);

    slider.addEventListener('input', (e) => {
        resolution = parseFloat(e.target.value);
        cellSize = width * resolution;
        loadCGrid();
        redraw = true;
        draw();
    });

    let angleToggle = document.createElement('button');
    angleToggle.innerText = 'Toggle No Angle Mode';
    document.body.appendChild(angleToggle);

    angleToggle.addEventListener('click', () => {
        noAngleMode = !noAngleMode;
        redraw = true;
        draw();
    });
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw = true;
    draw();
});

setup("");
update();
