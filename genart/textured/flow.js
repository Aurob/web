// Flow field
let redraw;
let cgrid = [];
let resolution, margin, cellSize, num_rows, left_x, right_x, left_y, right_y;

let ready = false;

function loadCGrid(width, height) {
    // let width = 500;
    // let height = 500;
    resolution = parseFloat(document.getElementById('resolution').value);
    margin = 0;
    cellSize = (width * resolution);
    num_rows = (width / cellSize) + (width * margin);
    left_x = width - margin;
    right_x = width + margin;
    left_y = height - margin;
    right_y = height + margin;
    let defaultAngle = 45;
    noiseSeed((new Date()).getTime());
    cgrid = [];
    for (let x = 0; x < num_rows; x++) {
        cgrid[x] = [];
        for (let y = 0; y < num_rows; y++) {
            // let angle = (y / (num_rows)) * PI;
            // let angle = noise(x * resolution / 100, y * resolution / 100) * 360;
            let angle = noise(x / 1000, y / 1000, frameCount / 100);
            // angle *= sqrt(x / 100) * noise(x / 100, y / 100, frameCount / 100);
            // angle *= sin(y / 100);
            // angle *= 360;
            // angle *= noise(x * resolution / 100, y * resolution / 100) * 360;
            // angle *= noise(x * resolution / 100, y * resolution / 100) * 360;
            // let angle = sin(x / 100) * cos(y / 100) * 360;
            cgrid[x][y] = {
                'angle': angle,
                'originalAngle': angle,
                'delta': 0
            }
        }
    }

    return cgrid;
}

function setup() {
    let curves = 2;
    createCanvas(document.body.clientWidth, document.body.clientHeight);
    // angleMode(DEGREES);
    loadCGrid(document.body.clientWidth, document.body.clientHeight);
    ready = true;
    redraw = true;

}

function draw() {
    if (!ready) return;
    if (redraw) {
        background(255);

        // cgrid.forEach((row, x) => {
        //     row.forEach((col, y) => {
        //         let x1 = (x * cellSize) - (width * margin);
        //         let y1 = (y * cellSize) - (height * margin);

        //         translate(x1 + cellSize / 2, y1 + cellSize / 2);
        //         rotate(col.angle);
        //         stroke(0);
        //         line(-cellSize / 2, 0, cellSize / 2, 0);
        //         resetMatrix();

        //     })
        // })

        for(let x = 0; x < width; x += cellSize) {
            for(let y = 0; y < height; y += cellSize) {
                drawTestCurve(frameCount, x, y);
            }
        }

        redraw = false;

    }
}

// Utilities


function drawTestCurve(seed, cx = 0, cy = 0) {
    noiseSeed(seed);
    let num_steps = 100;
    let step_resolution = 1; //random(0.01, 0.1);
    let step_length = 4;//(width * step_resolution);


    for (let n = 0; n < num_steps; n++) {
        // cx = random(width);
        // cy = random(height);
        let col_index = parseInt(cx / cellSize);
        let row_index = parseInt(cy / cellSize);
        let cx_step = 0;
        let cy_step = 0;
        beginShape();
        let alt = 0;
        for (let nn = 0; nn < num_steps; nn += 1) {

            if (col_index < 0 || col_index > cgrid.length - 1 || row_index < 0 || row_index > cgrid.length - 1) {
                break;
            }

            let cell_angle = cgrid[col_index][row_index].angle;

            cx_step = cos(cell_angle) * step_length;
            cy_step = sin(cell_angle) * step_length;

            let tx = cx;
            let ty = cy;
            cx += cx_step;
            cy += cy_step;

            col_index = parseInt(cx / cellSize);
            row_index = parseInt(cy / cellSize);

            if (col_index < 0 || col_index > cgrid.length - 1 || row_index < 0 || row_index > cgrid.length - 1) {
                break;
            }

            randomSeed(seed);
            if (alt >= num_steps / random(1, 10)) {
                
                endShape();
                beginShape();
                alt = 0;
            }

            // fill(r, g, b);
            // ellipse(tx, ty, 5, 5);
            alt += 1;
            curveVertex(cx, cy);
        }
        endShape();
    }

}

// Events

window.addEventListener('resize', () => {
    // resizeCanvas(window.innerWidth, window.innerHeight);
    redraw = true;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        redraw = true;
    }
    else if (e.code === 'KeyG') {
        loadCGrid();
        redraw = true;
    }
});

document.getElementById('resolution').addEventListener('change', (e) => {
    cgrid = loadCGrid(window.originalImageData.size[0], window.originalImageData.size[1], e.target.value);
});
