import express from 'express';
import fs from 'fs';
import https from 'https';
import sio from 'socket.io';

const app = express();
const options = { 
	key: fs.readFileSync(__dirname + '/remoteavatar-key.pem'),
	cert: fs.readFileSync(__dirname + '/remoteavatar-cert.pem')
};
const server = https.createServer(options, app).listen(process.env.PORT || 3000);
const io = sio(server);


app.use(express.static('public'));

app.get('/r/:room', function(req, res){
	console.log(111, req.params.room)
    res.sendFile(__dirname + '/public/index.html');
});
app.get('*', function(req, res){
	console.log(110)
    res.sendFile(__dirname + '/public/index.html');
});



io.sockets.on('connection', function(socket) {
	console.log(111);
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);
    let sr = io.sockets.adapter.rooms[room];

    if (sr === undefined) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (sr.length === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});