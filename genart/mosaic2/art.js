
var width = $(window).width();
var height = $(window).height();
var pause = false;

var canvas;
var loaded = false;
var pieces = [];
var lines = [];

class Line {
    points = [];
    constructor(x1, y1, x2, y2, edge, flat=false) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.edge = edge;
        this.flat = flat;
    }

    loadLinePoints() {
        let maxWidth = 7;
        let maxHeight = 7;
        //loop to create jagged line
        let step = 4;
        
        if(this.edge == 'top' || this.edge == 'bottom') {
            
            let x = this.x1;
            let lastX = this.x2;
            let lastY = this.y2;
            if(this.edge == 'top') {
                for(let i = x; i < this.x2; i+=step) {
                    let yoffset = (!this.flat && i != this.x2-1 && i != x) ? Math.random() * maxHeight - maxHeight/2 : 0;
                    let y = lastY + yoffset;
                    this.points.push({'x': i, 'y': y});
                    lastX = i;
                    lastY = y;
                }
            }

            else if(this.edge == 'bottom') {
                for(let i = this.x2; i > x; i-=step) {
                    let yoffset = (!this.flat && i != this.x2 && i != x+1) ? Math.random() * maxHeight - maxHeight/2 : 0;
                    let y = lastY + yoffset;
                    this.points.push({'x': i, 'y': y});
                    lastX = i;
                    lastY = y;
                }
            }
        }
        
        if(this.edge == 'left' || this.edge == 'right') {
            let y = this.y1;
            let lastY = this.y2;

            if(this.edge == 'right') {
                let lastX = this.x2;
                for(let i = y; i < this.y2; i+=step) {
                    let xoffset = (!this.flat && i != this.y2-1 && i != y) ? Math.random() * maxWidth - maxWidth/2 : 0;
                    let x = lastX + xoffset;
                    this.points.push({'x': x, 'y': i});
                    lastX = x;
                    lastY = i;
                }
            }
            else if(this.edge == 'left') {
                let lastX = this.x1;
                for(let i = y; i > this.y2; i-=step) {
                    let xoffset = (!this.flat && i != this.y2+1 && i != this.y) ? Math.random() * maxWidth - maxWidth/2 : 0;
                    let x = lastX + xoffset;
                    this.points.push({'x': x, 'y': i});
                    lastX = x;
                    lastY = i;
                }
            }
        }

    }

    draw() {
        for(let i = 0; i < this.points.length; i++) {
            let point = this.points[i];
            canvas.vertex(point.x, point.y);
        }
    }
}

var colors = ['red', 'blue', 'orange', 'black', 'gray'];
class Rectangle {
    lines = [];

    constructor(x, y, w, h, _color = null) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        // this.color = color(random(255), random(255), random(255));
        this.color = (_color) ? _color : color(colors[Math.floor(Math.random() * colors.length)]);
        this.rotation = random(360);
        this.opacity = 200 + random(56);
        // this.color.setAlpha(this.opacity);
        this.load_lines();
    }

    load_lines() {

        // let top = new Line(this.x, this.y, this.x + this.w, this.y, 'top', true); //Math.random() > 0.5);
        let top = new Line(0, 0, this.w, 0, 'top', Math.random() > 0.5);
        top.loadLinePoints();
        let top_last_x = top.points[top.points.length-1].x;
        let top_last_y = top.points[top.points.length-1].y;

        let right = new Line(top_last_x, top_last_y, this.w, this.h, 'right', Math.random() > 0.5);
        right.loadLinePoints();
        if(right.points.length-1 < 0) {
            return;
        }
        let right_last_x = right.points[right.points.length-1].x;
        let right_last_y = right.points[right.points.length-1].y;

        let bottom = new Line(0, this.h, right_last_x, right_last_y, 'bottom', Math.random() > 0.5);
        bottom.loadLinePoints();
        
        if (bottom.points.length-1 < 0) {
            return;
        }

        let bottom_last_x = bottom.points[bottom.points.length-1].x;
        let bottom_last_y = bottom.points[bottom.points.length-1].y;

        let left = new Line(0, 0, bottom_last_x, bottom_last_y, 'left', Math.random() > 0.5);
        left.loadLinePoints();

        this.lines.push(top);
        this.lines.push(right);
        this.lines.push(left);
        this.lines.push(bottom);
    }

    drawLines() {
        // canvas.fill(this.color);
        // canvas.stroke(this.color);
        canvas.fill(this.color);
        canvas.stroke(this.color);
        
        canvas.push();
        canvas.translate(this.x + this.w/2, this.y + this.h/2);
        canvas.rotate(this.rotation);
        canvas.beginShape();
        for(let i = 0; i < this.lines.length; i++) {
            this.lines[i].draw();
        }
        canvas.endShape(CLOSE);
        // canvas.rotate(0);
        canvas.pop();
    }
}

function setup() {
    load();    
}

function load() {
    if(loaded) {
        loaded = false;
        // remove();
    }
    pieces = [];
    fetch("/artdump/get_art.php?count=1&json=1&list&link").then(res => res.json())
    .then(data => {
        $('#link').html('');
        $('#link').append('<a href="/artdump/' + data.link + '" target="_blank">Original Image</a>');
        img = new Image();
        img.src = '/artdump/' + data.link;
        img.onload = function() {
            pixelateImage(img, 8).then(d=> {
                width = img.width;
                height = img.height;
                createCanvas(width, height);
                canvas = createGraphics(width, height);
                // console.log(canvas)
                canvas.strokeWeight(1);
                canvas.angleMode(DEGREES);
                loaded = true;    
            });
        };
    });
}

var wait_time = 0;
function draw() {

    if(loaded) {
        canvas.background(177);
    
        canvas.fill(255);
        canvas.strokeWeight(2);
    
        
        for(let i = 0; i < pieces.length; i++) {
            let piece = pieces[i];
            // console.log(piece);
            // alert();
            piece.drawLines();
        }
        
    
        if(!pause) {        
        }
    
        push();
        image(canvas, 0, 0);
        pop();
    }
}


function pixelateImage(originalImage, pixelationFactor) {
    return new Promise((res, rej) => {
        const _canvas = document.createElement("canvas");
        const context = _canvas.getContext("2d");
        const originalWidth = originalImage.width;
        const originalHeight = originalImage.height;
        const _canvasWidth = originalWidth;
        const _canvasHeight = originalHeight;
        _canvas.width = _canvasWidth;
        _canvas.height = _canvasHeight;
        context.drawImage(originalImage, 0, 0, originalWidth, originalHeight);
        const originalImageData = context.getImageData(
        0,
        0,
        originalWidth,
        originalHeight
        ).data;
        if (pixelationFactor !== 0) {
            for (let y = 0; y < originalHeight; y += pixelationFactor) {
                for (let x = 0; x < originalWidth; x += pixelationFactor) {
                // extracting the position of the sample pixel
                    const pixelIndexPosition = (x + y * originalWidth) * 4;
                    let r = originalImageData[pixelIndexPosition];
                    let g = originalImageData[pixelIndexPosition + 1];
                    let b = originalImageData[pixelIndexPosition + 2];
                    let a = originalImageData[pixelIndexPosition + 3];
                    let pw = pixelationFactor + random(pixelationFactor);
                    let ph = pixelationFactor + random(pixelationFactor);
                    pieces.push(new Rectangle(x, y, pw, ph, color(r, g, b)));
                }
            }
        }

        res();
    }); 
}