var stream = require('stream');
var util = require('util');
var _ = require('underscore');
var R2rml = require('../r2rml-js/r2rml.js');
var path = require('path');
var PropertiesReader = require('properties-reader');
var configuration = PropertiesReader(path.resolve(__dirname, '../', 'config', 'config.properties'));
var debug = require('debug')('TransformerStream');

var Transform = stream.Transform || require('readable-stream').Transform;

function TransformerStream(options) {
  // allow use without new
  if (!(this instanceof TransformerStream)) {
    return new TransformerStream(options);
  }

  this.transformer = new R2rml(path.resolve(__dirname, '../', configuration.get('transform_folder'), configuration.get('stream_mapping')));
  // init Transform
  Transform.call(this, options);
}
util.inherits(TransformerStream, Transform);


TransformerStream.prototype.enrich = function(triple) {

  result = this.transformer.transform(triple);

  return result;
};

TransformerStream.prototype._transform = function(chunk, enc, cb) {

  
  var data = chunk;
  data = this.enrich(data);

  this.push(data);
  cb();
};

exports = module.exports = TransformerStream;
