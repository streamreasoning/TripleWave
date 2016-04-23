var stream = require('stream');
var util = require('util');
var _ = require('underscore');

var Transform = stream.Transform || require('readable-stream').Transform;

function TransformerStream(options) {
  // allow use without new
  if (!(this instanceof TransformerStream)) {
    return new TransformerStream(options);
  }

  // init Transform
  Transform.call(this, options);
}
util.inherits(TransformerStream, Transform);


var enrich = function(triple) {



  return result;
};

TransformerStream.prototype._transform = function(chunk, enc, cb) {

  var change = JSON.parse(chunk.toString());
  change = enrich(change);

  this.push(JSON.stringify(change));
  cb();
};

exports = module.exports = TransformerStream;