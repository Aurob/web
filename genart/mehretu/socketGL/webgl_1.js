var canvas = document.getElementById("c");
var gl = canvas.getContext("webgl");
var bsmain = 10;
var bcmain = 10;
canvas.addEventListener('click',()=>{
    main(bcmain,bsmain);
});
function main(bcount, bsize){
    if(!gl) console.log("WebGl will not work in this context");
    var vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        void main() {
            // convert the position from pixels to 0.0 to 1.0
            vec2 zeroToOne = a_position / u_resolution;
        
            // convert from 0->1 to 0->2
            vec2 zeroToTwo = zeroToOne * 2.0;
        
            // convert from 0->2 to -1->+1 (clip space)
            vec2 clipSpace = zeroToTwo - 1.0;
        
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
    `;
    var fragmentShaderSource = `
        // fragment shaders don't have a default precision so we need
        // to pick one. mediump is a good default
        precision mediump float;
        uniform vec4 u_color;
        
        void main() {
            // gl_FragColor is a special variable a fragment shader
            // is responsible for setting
            gl_FragColor = u_color;
        }
    `;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // look up uniform locations
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");

    var positionBuffer = gl.createBuffer();
    // bind the position buffer to WebGL 
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // put the data in the binded buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,0,0,0,0,0,0,0,1]), gl.STATIC_DRAW);

    resize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height); 
	
    bcmain = bcount;
    bsmain = bsize;
    drawRectangles(gl, colorUniformLocation, bcount, bsize);
    
    
}
function drawRectangles(gl, colorUniformLocation, rectangles, size){
    for(var i = 0; i < rectangles; i++){
        //location
        var rW = rInt(canvas.width);
        var rH = rInt(canvas.height);
        setRectangle(gl, rW,rH, rInt(size),rInt(size));
        //random color
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
    }
}

function rInt(range){
    return Math.floor(Math.random() * range);
}
function setRectangle(gl, x, y, w, h){
    var x1 = x;
    var x2 = x + w;
    var y1 = y;
    var y2 = y + h;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2, 
        x2, y1,
        x2, y2
    ]), gl.STATIC_DRAW);
}
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width  !== displayWidth ||
        canvas.height !== displayHeight) {

    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
    }
}
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    //Error
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    //Error
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}