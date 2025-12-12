var socket = io();
var sid;

users = {};

socket.on("init",(e)=>{
    sid  = socket.id;
    users = e;
    console.log(e);
});

socket.on("user_join",(e)=>{
    users[e] = {"pos":{x:0,y:0},"shots":[]};
});
socket.on("user_leave", (e)=>{
    delete users[e];
});
socket.on("user_move", (e)=>{
    users[e.user].pos = e.pos;
});
socket.on("user_shoot", (e)=>{
    users[e.user].shots.push(e.pos);
});

var canvas = document.getElementById("c");
canvas.style.cursor = "crosshair";
canvas.addEventListener('mousemove', (e)=>{
    mouse_pos.x = e.clientX;
    mouse_pos.y = e.clientY;
});

var gl = canvas.getContext("webgl");
if(!gl) console.log("WebGl unable to load...");

var user_pos = {x: 1, y: 1, scale: 0};
var mouse_pos = {x: 0, y: 0};
var color = {r:Math.random(), g:Math.random(), b:Math.random()};

window.addEventListener('keypress', (e)=>{
    var valid_move = true;
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
            break;
        default:
            valid_move = false;
            break;
    }
    if(valid_move){
        socket.emit("user_move", {"user":sid,"pos":user_pos});
    } 
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
        
        drawShape(gl, scaleLocation, [-1,0], user_pos, color, false, colorUniformLocation);

        for(var user in users){
            if(user != sid){
                userID = user;
                user = users[user];
                if(user.x != 0 && user.y != 0){
                    drawShape(gl, scaleLocation, [-1,0], user.pos, true, colorUniformLocation);  
                    for(var shot in user.shots){
                        shotC = shot;
                        shot = user.shots[shot];
                        take_shot(shot.x,shot.y, shot.xd, shot.yd, true, 5);
                        user.shots.splice(shotC,1);
                    }
                }
            }
        }
        
        main_render = requestAnimationFrame(render);
    }

    const speed = 3;
    function take_shot(ux, uy, xdirection, ydirection, non_client, speed){
        
        function shoot(){    
            var hit = false;
            if(ux > canvas.width){
                console.log("ASKDJBNASKDJB"); 
                window.cancelAnimationFrame(player_shot);
                return false;
            }
            if(non_client){
                if((ux < user_pos.x + 10 && user_pos.x < ux + 10) &&
                    uy < user_pos.y + 10 && user_pos.y < uy){
                        console.log("HIT");
                        hit = true;
                        return hit;
                }
            }else{
                
                for(var user in users){
                    user = users[user];
                    if((ux < user.pos.x + 10 && user.pos.x < ux + 10) &&
                        uy < user.pos.y + 10 && user.pos.y < uy){
                            //console.log("HIT");
                            hit = true;
                            return hit;
                    }
                }
                
            }
            if(!hit){
                drawShape(gl, scaleLocation, [-1,0], {x:ux, y:uy},null,true, colorUniformLocation);  
                ux += xdirection*speed;
                uy += ydirection*speed;
                player_shot = requestAnimationFrame(shoot);
            }else window.cancelAnimationFrame(player_shot);          
        }
        var player_shot = requestAnimationFrame(shoot);
        
    }
    window.addEventListener('mouseup',()=>{
        var ux = user_pos.x;
        var uy = user_pos.y;
        
        var angle = Math.atan2((uy - mouse_pos.y),(ux - mouse_pos.x));
        
        var speed = 5;
        var xdirection = -Math.cos(angle);
        var ydirection = -Math.sin(angle);
        socket.emit("user_shoot", {"user":sid,"pos":{x:ux,y:uy,xd:xdirection,yd:ydirection}});
        take_shot(ux, uy, xdirection, ydirection, false, speed)
    });


    //Begin animations
    //main_render = requestAnimationFrame(render);
    render();


}

function drawShape(gl, scaleLocation, scale, pos, color, shot,colorUniformLocation){

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
    coloru = colorUniformLocation;
    if(shot)
        gl.uniform4f(coloru,0,0,255,1); //For random color//Math.random(), Math.random(), Math.random(), 1);
    else gl.uniform4f(coloru,color.r,color.g,color.b, 1);
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
    //console.log(gl.getShaderInfoLog(shader));
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
    //console.log(gl.getProgramInfoLog(program));
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