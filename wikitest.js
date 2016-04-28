var io = require('socket.io-client');
var socket = io.connect('stream.wikimedia.org/rc');

socket.on('connect', function() {
  socket.emit('subscribe', 'commons.wikimedia.org');
});

socket.on('change', function(data) {
  console.log(data.title);
});