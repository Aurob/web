
var width = 500;//window.innerWidth;
var height = 500;//window.innerHeight - window.innerHeight/10;
var pause = false;

var canvas;
function setup() {
    loadOptions();
    createCanvas(1000, 1000);
    canvas = createGraphics(1000, 1000);
    background(220);
}


let base_line = {
    'x': 0,
    'y': height+ height,
    'w': width,
    'h': height,
};



let offsetX = -width / 4;
let offsetDX = 10;
let lineSpacingDelta = .01;
let lineSpacing = 4;
let lineSpacingAngle = 2.27;
let lineWeight = 2.2;
function draw() {

    canvas.background(255);
    canvas.strokeWeight(lineWeight);
    canvas.line(base_line.x, base_line.y, base_line.x + base_line.w, base_line.y + base_line.h);

    for(let i = 0; i < base_line.w + 1; i+=lineSpacing) {
        let ortho_line = {
            'x': base_line.x + i*lineSpacingAngle,
            'y': base_line.y,
            'w': i + offsetX,
            'h': height,
        };

        //draw line with points
        // for(let j = 0; j < ortho_line.h; j+=10) {
        //     let line_point = {
        //         'x': ortho_line.x,
        //         'y': ortho_line.y - j,
        //     };

        //     //mouse affect radius
        //     let mradius = 10;
        //     let mdist = dist(line_point.x, line_point.y, mouseX, mouseY);
        //     //if the mouse is within a certain radius of this point
        //     // if(mdist < 55 && mdist > 53) {
        //     //     let noise_value = Math.cos(mouseX);
        //     //     // line_point.x += noise_value; 
        //     //     // line_point.y += noise_value;
        //     //     ellipse(line_point.x, line_point.y, 33, 33);   
        //     // }

        //     // else {

        //     //     // point(line_point.x, line_point.y);
        //         // line(line_point.x, line_point.y, line_point.x + offsetDX, line_point.y + offsetDX);
        //     // }
        //         //noise(line_point.x, line_point.y);
        //     // let noise_value_scaled = noise_value * width;
            

        // }
        // line(ortho_line.x, ortho_line.y, ortho_line.x + ortho_line.w, ortho_line.y + ortho_line.h);

        canvas.line(ortho_line.x, ortho_line.y, ortho_line.x + ortho_line.w, ortho_line.y - ortho_line.h);
    }

    // Again but at a 90 degree angle
    for(let i = 0; i < base_line.h + 1; i+=lineSpacing) {
        let ortho_line = {
            'x': 0,
            'y': height + (base_line.y - i*(lineSpacingAngle + 6)),
            'w': width,
            'h': height,
        };
        canvas.line(ortho_line.x, ortho_line.y, ortho_line.x + ortho_line.w, ortho_line.y - ortho_line.h);
    
    }

    // if(mouseIsPressed) {
    //     // ellipse(mouseX, mouseY, 10, 10);
    //     // let noise_value = noise(mouseX, mouseY);
    //     // let noise_value_scaled = noise_value * width;

    //     // ellipse(noise_value_scaled, mouseY, 10, 10);
    //     // ellipse(no
    if(!pause) {
        // offsetX += offsetDX;
        // if(offsetX > width/2 || offsetX < -width) offsetDX *= -1;
        lineSpacing += lineSpacingDelta;
        if(lineSpacing > 4 || lineSpacing < 1) lineSpacingDelta *= -1;


    }

    push();
    // 
    image(canvas, 0, 0);
    
    // translate(0, height/2);
    // rotate(180);
    // copy(canvas, 0, 0, width, height, 0,0, width, height);
    pop();
}

