var stream = require('stream');
var util = require('util');

var Transform = stream.Transform || require('readable-stream').Transform;

function SampleStream(options) {
  // allow use without new
  if (!(this instanceof SampleStream)) {
    return new SampleStream(options);
  }

 //Insert stream logic here
 //this.push('something');

  // init Transform
  Transform.call(this, options);


}
util.inherits(SampleStream, Transform);

SampleStream.prototype._read = function(enc, cb) {};

exports = module.exports = SampleStream;
