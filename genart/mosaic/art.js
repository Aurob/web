
var width = $(window).width();
var height = $(window).height();
var pause = false;

var canvas;
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

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        // this.color = color(random(255), random(255), random(255));
        this.color = color(colors[Math.floor(Math.random() * colors.length)]);
        this.rotation = random(360);
        this.opacity = 200 + random(56);
        this.color.setAlpha(this.opacity);
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
        let right_last_x = right.points[right.points.length-1].x;
        let right_last_y = right.points[right.points.length-1].y;

        let bottom = new Line(0, this.h, right_last_x, right_last_y, 'bottom', Math.random() > 0.5);
        bottom.loadLinePoints();
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
    width = $(window).width();
    height = $(window).height();
    createCanvas(width, height);
    canvas = createGraphics(width, height);
    canvas.strokeWeight(1);
    canvas.angleMode(DEGREES);
    
    let width_pieces = 30;
    let height_pieces = 30;
    
    let _width = width/1.25;
    let _height = height/1.25;

    let offsetX = (width - _width) / 2;
    let offsetY = (height - _height) / 2;

    for(let i = 0; i < width_pieces; i++) {
        for(let j = 0; j < height_pieces; j++) {
            let x = i * _width / width_pieces;
            let y = j * _height / height_pieces;
            x += offsetX;
            y += offsetY;
            let w = (25) + Math.random() * _width / width_pieces;
            let h = (25) + Math.random() * _height / height_pieces;
            pieces.push(new Rectangle(x, y, w, h));
        }
    }
    
}

var wait_time = 0;
function draw() {

    canvas.background(177);
    
    canvas.fill(255);
    canvas.strokeWeight(2);

    
    for(piece of pieces) {
        piece.drawLines();
    }
    

    if(!pause) {        
    }

    push();
    image(canvas, 0, 0);
    pop();
}

