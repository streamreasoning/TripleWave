const stream = require('stream');
const util = require('util');
const wikichanges = require("wikichanges");
const io = require('socket.io-client')
const debug = require('debug')('Wikistream');

const Transform = stream.Transform || require('readable-stream').Transform;

// Stream wikipedia changing using socket.io
// PROBLEM: wikipedia uses an old version of socket.io
function WikiStream(options) {
  // allow use without new
  if (!(this instanceof WikiStream)) {
    return new WikiStream(options);
  }
  
  debug('Creating the stream');
  this.close = false;

  var socket = io.connect('stream.wikimedia.org/rc', {
    reconnect: true
  });

  var _this = this;

  socket.on('connect', function() {
    debug('Connected');
    socket.emit('subscribe', 'commons.wikimedia.org');
  });

  socket.on('error', function(error) {
    debug(error);
  });
  socket.on('change', function(data) {
    debug(data);
    _this.push(data)
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