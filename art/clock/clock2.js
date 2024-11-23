let width = window.innerWidth/1.5;
let height = window.innerHeight/1.5;
let radius = Math.min(width, height) / 2;
let hourHandLength, minuteHandLength, secondHandLength;
let hourHandWidth, minuteHandWidth, secondHandWidth;
let hourAngle, minuteAngle, secondAngle;

function drawClock() {
    // circle, 12 numbers, center dot, 3 hands
    let center = createVector(width / 2, height / 2);
    let dotRadius = radius / 40;
    // Clock Radius and center dot
    circle(center.x, center.y, radius * 2);
    fill(0);
    circle(center.x, center.y, dotRadius * 2);
    noFill();

    // Hands
    let now = new Date();
    let hour = now.getHours() % 12;
    let minute = now.getMinutes();
    let second = now.getSeconds();
    let millisecond = now.getMilliseconds();
    let hourAngle = map(hour + minute / 60, 0, 12, 0, 360);
    let minuteAngle = map(minute + second / 60, 0, 60, 0, 360);
    let secondAngle = map(second + millisecond / 1000, 0, 60, 0, 360);

    // Hour Hand
    push();
    translate(center.x, center.y);
    rotate(hourAngle);
    line(0, 0, 0, -hourHandLength);
    pop();

    // Minute Hand
    push();
    translate(center.x, center.y);
    rotate(minuteAngle);
    line(0, 0, 0, -minuteHandLength);
    pop();

    // Second Hand
    push();
    translate(center.x, center.y);
    rotate(secondAngle);
    stroke(secondHandColor);
    line(0, 0, 0, -secondHandLength);
    pop();

    push()
    fill(0);
    // Numbers
    let numberRadius = radius * 0.9;
    let numberSize = radius / 10;
    let numberAngle = 0;
    for(let i = 1; i <= 12; i++) {
        let x = center.x + numberRadius * cos(numberAngle);
        let y = center.y + numberRadius * sin(numberAngle);
        text(i, x - numberSize / 2, y + numberSize / 2);
        numberAngle += 360 / 12;
    }
    pop();

}

function setup() {
    createCanvas(window.innerWidth/1.5, window.innerHeight/1.5);
    angleMode(DEGREES);
    hourHandLength = radius * 0.5;
    hourHandWidth = radius / 20;
    hourHandColor = color(0, 0, 0);

    minuteHandLength = radius * 0.8;
    minuteHandWidth = radius / 30;
    minuteHandColor = color(0, 0, 0);

    secondHandLength = radius * 0.95;
    secondHandWidth = radius / 40;
    secondHandColor = color(255, 0, 0);

    redraw = true;
}

function draw() {

    if(redraw) {
        background(255);
        drawClock();
        // redraw = false;
    }
}


window.addEventListener('resize', () => {
    resizeCanvas(window.innerWidth/1.5, window.innerHeight/1.5);
    redraw = true;
});
