var socket = io();

socket.on("init", init);
function init(){
    console.log("app started...");
}