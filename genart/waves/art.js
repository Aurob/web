var width = 1000, height = 750;
var canvas = $('canvas');
var ctx = canvas[0].getContext('2d');

//set canvas size
canvas.prop('width', width);
canvas.prop('height', height);

var animation;
var generator;
var time = 0;
var backgroundColor = "1c3e6d";
var fill_strokeColor = "e3c192";

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
    ctx.fillStyle = "#"+backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff";

    generator.draw();
    
    time++;
    animation = requestAnimationFrame(draw);
}

function start() {
    time = 0;
    generator = new Generator();
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

//https://stackoverflow.com/a/54569758
function invertHex(hex) {
    return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

canvas.on('mousemove', function (e) {
    var x = e.offsetX;
    var y = e.offsetY;
    generator.mouse = {'x': x, 'y': y};
});

window.addEventListener('DOMContentLoaded', function () {
    let options = {
        'reset': {
            'type': 'button',
            'action': function () {
                cancelAnimationFrame(animation);
                start();
            },
            'hide': true
        },
        'pause': {
            'type': 'button',
            'action': pause,
            // 'hide': true
        }
    }

    loadOptions(options);
    start();
});
