var stream = require('stream');
var util = require('util');
var wikichanges = require("wikichanges");
var io = require('socket.io-client')

var Transform = stream.Transform || require('readable-stream').Transform;

function WikiStream(options) {
  // allow use without new
  if (!(this instanceof WikiStream)) {
    return new WikiStream(options);
  }
  console.log('Creating the stream');
  this.close = false;

  var socket = io.connect('stream.wikimedia.org/rc', {
    reconnect: true
  });

  var _this = this;

  socket.on('connect', function() {
    socket.emit('subscribe', 'commons.wikimedia.org');
  });

  socket.on('error', function(error) {
    console.log(error);
  });
  socket.on('change', function(data) {
    console.log(data.title);
    _this.push(JSON.stringify(data))
  });
  // init Transform
  Transform.call(this, options);


}
util.inherits(WikiStream, Transform);

WikiStream.prototype._read = function(enc, cb) {};

WikiStream.prototype.closeStream = function() {
  this.close = true;
};
exports = module.exports = WikiStream;