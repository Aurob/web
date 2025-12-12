// https://p5js.org/learn/getting-started-in-webgl-shaders.html
// vec2(x,y)     // a vector of two floats
// vec3(r,g,b)   // a vector of three floats
// vec4(r,g,b,a) // a vector of four floats
// float         // a number with decimal points
// int           // a whole number without decimal points
// sampler2D     // a reference to a texture
//
let myShader;

function preload() {
    // load each shader file (don't worry, we will come back to these!)
    myShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
    // the canvas has to be created with WEBGL mode
    createCanvas(windowWidth, windowHeight, WEBGL);
    describe('a simple shader example that outputs the color red')
}

function draw() {
    shader(myShader);
    // setUniform can then be used to pass data to our shader variable, myColor
    myShader.setUniform('myColor', [sin(frameCount * 0.07), 0.0, 0.0, 1.0]);
    // apply the shader to a rectangle taking up the full canvas
    rect(0,0,width,height);
  }