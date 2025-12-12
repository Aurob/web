var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 1234;

app.use(express.static(__dirname));
app.get('/', function(req, res){
  res.sendFile('glient.html', { root: __dirname });
});
users = {};
function onConnect(socket){
    console.log("socket connection...");
    users[socket.id] = {"pos":{x:0,y:0},"shots":[]};

    socket.emit("init",users);
    socket.broadcast.emit("user_join", socket.id);

    socket.on("user_move", (e)=>{
      //users[e.user].pos = e.pos;
      socket.broadcast.emit("user_move", e);
    });
    socket.on("user_shoot", (e)=>{
      socket.broadcast.emit("user_shoot", e);
    });
    socket.on("disconnect", ()=>{
      delete users[socket.id];
      socket.broadcast.emit("user_leave", socket.id);
    });
}
io.on('connection',onConnect);
http.listen(port, () => console.log('listening on '+port));



/*
List of IO methods

// sending to sender-client only
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.in('game').emit('message', 'cool game');

// sending to sender client, only if they are in 'game' room(channel)
socket.to('game').emit('message', 'enjoy the game');

// sending to all clients in namespace 'myNamespace', include sender
io.of('myNamespace').emit('message', 'gg');

// sending to individual socketid
socket.broadcast.to(socketid).emit('message', 'for your eyes only');

// list socketid
for (var socketid in io.sockets.sockets) {}
 OR
Object.keys(io.sockets.sockets).forEach((socketid) => {});

*/