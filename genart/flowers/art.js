var width = 1000, height = 750;
var canvas = $('canvas');
var ctx = canvas[0].getContext('2d');
//set canvas size
canvas.prop('width', width);
canvas.prop('height', height);

var animation;
var generator;
var time = 0;
var margin = 10;
var flowerCount = 100;
var marginX = width / margin;
var marginY = height / margin;

//Circle wrapper
ctx.circle = function (x, y, r, color, fill = false) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.stroke();
    if (fill) ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    generator.draw(ctx, time);

    time++;
    animation = requestAnimationFrame(draw);
}

function start() {
    time = 0;
    generator = new Generator(flowerCount, width, height, marginX, marginY);
    animation = requestAnimationFrame(draw);
}

function pause() {
    if (animation) {
        cancelAnimationFrame(animation);
        animation = null;
    }
    else {
        start();
    }
}

window.addEventListener('DOMContentLoaded', function () {
    let options = {
        'reset': {
            'type': 'button',
            'action': function () {
                start();
            }
        }
    }

    loadOptions(options);
    start();
});
