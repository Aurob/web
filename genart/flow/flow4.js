let canvas, ctx;
let redraw;
let cgrid = [];
let width = 500;
let height = 500;
let resolution = width * 0.05;
let cellSize = width / resolution;

function random(max) {
    return Math.random() * max;
}

function color(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
}

function loadCGrid() {
    for (let x = 0; x < resolution; x++) {
        cgrid[x] = [];
        for (let y = 0; y < resolution; y++) {
            cgrid[x][y] = {
                'a': random(360),
                'rgb': color(random(255), random(255), random(255))
            };
        }
    }
}

function setup() {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    loadCGrid();
    redraw = true;
    draw();
}

function draw() {
    if (redraw) {
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, width, height);

        cgrid.forEach((row, x) => {
            row.forEach((col, y) => {
                let x1 = x * cellSize;
                let y1 = y * cellSize;

                ctx.save();
                ctx.translate(x1 + cellSize / 2, y1 + cellSize / 2);
                ctx.rotate(col.a * Math.PI / 180);
                ctx.fillStyle = col.rgb;
                ctx.fillRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
                ctx.restore();
            });
        });

        redraw = false;
    }
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw = true;
    draw();
});

setup();
