
var width = $(window).width();
var height = $(window).height();
var pause = false;

var canvas;

let circles = [];
let growth_rate = .95;

function setup() {
    loadOptions();
    width = $(window).width();
    height = $(window).height();
    createCanvas(width, height);
    canvas = createGraphics(width, height);
    console.log(width, height);
    canvas.strokeWeight(1);
    // Create a square of circles
    // center the square in the canvas
    // add padding around each circle
    // so that they don't touch
    let radius = width / 20;
    let padding = radius / 2;
    let num_circles = 10;
    let xoffset = (width - (num_circles * (radius * 1.1 + padding) + padding)) / 2;
    let yoffset = (height - (num_circles * (radius * 1.1 + padding) + padding)) / 2;
    let start_radius = 1;
    for(let i = 0; i < num_circles; i++) {
        for(let j = 0; j < num_circles; j++) {
            let x = (i * (radius + padding)) + radius + padding + xoffset;
            let y = (j * (radius + padding)) + radius + padding + yoffset;
            circles.push(new Circle(x, y, start_radius, 0));
        }
    }
}

class Circle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        canvas.fill(0, 0, 0, 0);
        canvas.ellipse(this.x, this.y, this.radius);
    }
}

function draw() {

    // off white color with a slight yellowish tint in rgb: (250, 250, 240)
    canvas.background(250, 250, 240);

    for(circle of circles) {
        circle.draw();
    }

    if(!pause) {

        for(circle of circles) {
            circle.radius += growth_rate;
        }
        if(circles[0].radius > width/1.5 || circles[0].radius < 0) {
            growth_rate*=-1;
        }
    }

    push();
    image(canvas, 0, 0);
    pop();
}

