// Flow field
let redraw;
let cgrid = [];
let resolution, margin, cellSize, num_rows, left_x, right_x, left_y, right_y;

let ready = false;
let mouseX = 0;
let mouseY = 0;

function loadCGrid(width, height) {
    resolution = parseFloat(document.getElementById('resolution').value);
    margin = 0;
    cellSize = (width * resolution);
    num_rows = (width / cellSize) + (width * margin);
    left_x = width - margin;
    right_x = width + margin;
    left_y = height - margin;
    right_y = height + margin;
    cgrid = [];
    for (let x = 0; x < num_rows; x++) {
        cgrid[x] = [];
        for (let y = 0; y < num_rows; y++) {
            let angle = noise.perlin3(x / 100, y / 100, performance.now() / 1000);
            angle *= Math.sqrt(x / 100) * noise.perlin3(x / 100, y / 100, performance.now() / 1000);
            angle *= 360;
            cgrid[x][y] = {
                'angle': angle,
                'delta': 0
            }
        }
    }
    return cgrid;
}

let curves = [];
function makeCurve(width, height) {
    let cx = Math.random() * width;
    let cy = Math.random() * height;
    let num_steps = Math.random() * (100 - 10) + 10;
    let step_resolution = 0.1;
    let step_length = (width * step_resolution);
    let col_index = parseInt(cx / cellSize);
    let row_index = parseInt(cy / cellSize);

    let curve = {
        'start': [cx, cy],
        'steps': num_steps,
        'resolution': step_resolution,
        'length': step_length,
        'color': [Math.random() * 255, Math.random() * 255, Math.random() * 255]
    }

    curves.push(curve);
}

function getPointsAlongLine(x1, y1, x2, y2, numPoints) {
    var points = [];
    for (var i = 1; i <= numPoints; i++) {
        var t = i / (numPoints + 1);
        var x = x1 + (x2 - x1) * t;
        var y = y1 + (y2 - y1) * t;
        points.push({ x: x, y: y });
    }
    return points;
}

function drawCurve(ctx) {
    curves.forEach(curve => {
        let fx = 0;
        let fy = 0;
        let lx = 0;
        let ly = 0;
        for (let n = 0; n < curve.steps; n++) {
            let cx = curve.start[0];
            let cy = curve.start[1];
            if (n == 0) {
                fx = cx;
                fy = cy;
            }
            let col_index = parseInt(cx / cellSize);
            let row_index = parseInt(cy / cellSize);
            ctx.beginPath();
            ctx.strokeStyle = `rgb(${curve.color[0]}, ${curve.color[1]}, ${curve.color[2]})`;
            ctx.lineWidth = 5;

            for (let nn = 0; nn < curve.steps; nn += 0.5) {
                ctx.lineTo(cx, cy);

                let cell_angle = cgrid[col_index][row_index].angle;

                let cx_step = Math.cos(cell_angle) * curve.length;
                let cy_step = Math.sin(cell_angle) * curve.length;

                cx += cx_step;
                cy += cy_step;

                col_index = parseInt(cx / cellSize);
                row_index = parseInt(cy / cellSize);

                if (col_index < 0 || col_index > cgrid.length - 1 || row_index < 0 || row_index > cgrid.length - 1) {
                    break;
                }
            }
            ctx.stroke();
            if (n == curve.steps - 1) {
                lx = cx;
                ly = cy;
            }
        }
    })
}

function drawTestCurve(ctx, seed, cx = 0, cy = 0) {
    let num_steps = 100;
    let step_length = 1;

    ctx.beginPath();
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.lineWidth = 5;

    for (let n = 0; n < num_steps; n++) {
        let col_index = parseInt(cx / cellSize);
        let row_index = parseInt(cy / cellSize);
        let alt = 0;
        for (let nn = 0; nn < num_steps; nn += 1) {
            if (col_index < 0 || col_index > cgrid.length - 1 || row_index < 0 || row_index > cgrid.length - 1) {
                break;
            }

            let cell_angle = cgrid[col_index][row_index].angle;

            let cx_step = Math.cos(cell_angle) * step_length;
            let cy_step = Math.sin(cell_angle) * step_length;

            cx += cx_step;
            cy += cy_step;

            col_index = parseInt(cx / cellSize);
            row_index = parseInt(cy / cellSize);

            if (col_index < 0 || col_index > cgrid.length - 1 || row_index < 0 || row_index > cgrid.length - 1) {
                break;
            }

            if (alt >= num_steps / (Math.random() * (10 - 1) + 1)) {
                const r = window.originalImageData.imgdata[parseInt(cx) * 4 + parseInt(cy) * window.originalImageData.size[0] * 4];
                const g = window.originalImageData.imgdata[parseInt(cx) * 4 + parseInt(cy) * window.originalImageData.size[0] * 4 + 1];
                const b = window.originalImageData.imgdata[parseInt(cx) * 4 + parseInt(cy) * window.originalImageData.size[0] * 4 + 2];
                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

                ctx.stroke();
                ctx.beginPath();
                alt = 0;
            }
            alt += 1;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }
}

function setup() {
    let curves = 2;
    image_load()
        .then((img) => {
            pixelateImage(img)
                .then((originalImageData) => {
                    window.originalImageData = originalImageData;

                    const canvas = document.createElement('canvas');
                    canvas.width = originalImageData.size[0];
                    canvas.height = originalImageData.size[1];
                    document.body.appendChild(canvas);
                    const ctx = canvas.getContext('2d');

                    loadCGrid(originalImageData.size[0], originalImageData.size[1]);
                    for (let i = 0; i < curves; i++) {
                        makeCurve(originalImageData.size[0], originalImageData.size[1]);
                    }
                    ready = true;
                    draw(ctx);
                });
        });

    redraw = true;
}

function update() {
    // to updated noise based params in each frame
    cgrid.forEach((row, x) => {
        row.forEach((col, y) => {
            let angle = noise.perlin3(x / 100, y / 100, performance.now() / 1000);
            angle *= Math.sqrt(x / 100) * noise.perlin3(x / 100, y / 100, performance.now() / 1000);
            angle *= 360;
            col.angle = angle;
        })
    });
}

function draw(ctx) {
    if (!ready) return;
    if (1) {
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        cgrid.forEach((row, x) => {
            row.forEach((col, y) => {
                let x1 = (x * cellSize) - (ctx.canvas.width * margin);
                let y1 = (y * cellSize) - (ctx.canvas.height * margin);

                ctx.save();
                ctx.translate(x1 + cellSize / 2, y1 + cellSize / 2);
                ctx.rotate(col.angle);
                const r = window.originalImageData.imgdata[parseInt(x1) * 4 + parseInt(y1) * window.originalImageData.size[0] * 4];
                const g = window.originalImageData.imgdata[parseInt(x1) * 4 + parseInt(y1) * window.originalImageData.size[0] * 4 + 1];
                const b = window.originalImageData.imgdata[parseInt(x1) * 4 + parseInt(y1) * window.originalImageData.size[0] * 4 + 2];
                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.lineWidth = cellSize;
                ctx.beginPath();
                ctx.moveTo(-cellSize / 2, 0);
                ctx.lineTo(cellSize / 2, 0);
                ctx.stroke();
                ctx.restore();

                const mdist = Math.hypot(mouseX - x1, mouseY - y1);
                if (mdist - cellSize / 2 < cellSize)
                    col.delta = 0.9;

                if (col.delta > 0) {
                    col.angle += col.delta;
                    col.delta -= 0.002;
                }
            })
        })
    }
}

window.addEventListener('resize', () => {
    redraw = true;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        redraw = true;
    } else if (e.code === 'KeyG') {
        loadCGrid();
        redraw = true;
    }
});

document.getElementById('resolution').addEventListener('change', (e) => {
    cgrid = loadCGrid(window.originalImageData.size[0], window.originalImageData.size[1], e.target.value);
});

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    redraw = true;
});

window.addEventListener('load', setup);