var vertexShaderSource = `attribute vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_scale;
void main() {
    //scale
    vec2 scaledPosition = a_position * u_scale;
    
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}`
var fragmentShaderSource = `// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;
uniform vec4 u_color;

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    gl_FragColor = u_color;
}`;
var canvas = document.getElementById("c");
var gl = canvas.getContext("webgl");
if(!gl) console.log("WebGl will not work in this context");
var user_pos = {x: 1, y: 1, scale: 0};
var mouse_pos = {x: 0, y: 0};
window.addEventListener('keypress', (e)=>{
    
    switch(e.key){
        case "w":
            user_pos.y -=10;
            break;
        case "s":
            user_pos.y +=10;
            break;
        case "a":
            user_pos.x -=10;
            break;
        case "d":
            user_pos.x +=10;
        default:
            break;
    }
});
canvas.style.cursor = "crosshair";
canvas.addEventListener('mousemove', (e)=>{
    mouse_pos.x = e.clientX;
    mouse_pos.y = e.clientY;
});
window.addEventListener('zoom', (e)=>{
    resize(canvas);
});

function main(){
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // look up uniform locations
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");
    var scaleLocation = gl.getUniformLocation(program, "u_scale");

    var positionBuffer = gl.createBuffer();
    // bind the position buffer to WebGL 
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

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

    //location

    //random color
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
    
    
    var scale = [-40,0];
    var then = 0;
    function render(now) {
        // im++;
        // if(im == max) im = 0;
        // texture = textures[im];
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;
        //drawScene(gl, programInfo, buffers, texture, deltaTime, zoom);
        drawShape(gl, scaleLocation, [-1,0], user_pos);
        main_render = requestAnimationFrame(render);
    }
    canvas.addEventListener('click', ()=>{
        console.log("shoot");

        var ux = user_pos.x;
        var uy = user_pos.y;
        
        var angle = Math.atan2((uy - mouse_pos.y),(ux - mouse_pos.x));
        var speed = 5;
        var xdirection = -Math.cos(angle);
        var ydirection = -Math.sin(angle);
        console.log(xdirection+","+ydirection);

        function shoot(){
            if(ux <=0 || ux >=canvas.width) return;
            drawShape(gl, scaleLocation, [-1,0], {x:ux, y:uy});  
            ux += xdirection*speed;
            uy += ydirection*speed;
            main_render = requestAnimationFrame(shoot);    
        }
        main_render = requestAnimationFrame(shoot);    
        
    });
    main_render = requestAnimationFrame(render);

}
function drawShape(gl, scaleLocation, scale, pos){
    var x1 = pos.x;
    var x2 = x1 + 10;
    var y1 = pos.y;
    var y2 = y1 + 10;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2, 
        x2, y1,
        x2, y2
    ]), gl.STATIC_DRAW);

    //scale
    gl.uniform2fv(scaleLocation, scale);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
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
main();