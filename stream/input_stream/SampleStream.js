var stream = require('stream');
var util = require('util');

var Transform = stream.Transform || require('readable-stream').Transform;

function SampleStream(options) {
  // allow use without new
  if (!(this instanceof WikiStream)) {
    return new WikiStream(options);
  }

 //Insert stream logic here
 //this.push('something');

  // init Transform
  Transform.call(this, options);


}
util.inherits(SampleStream, Transform);

WikiStream.prototype._read = function(enc, cb) {};

exports = module.exports = SampleStream;
