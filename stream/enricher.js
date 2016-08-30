var stream = require('stream');
var util = require('util');
var _ = require('underscore');
var R2rml = require('../r2rml-js/r2rml.js');
var PropertiesReader = require('properties-reader');
var path = require('path');
var Transform = stream.Transform || require('readable-stream').Transform;
var N3 = require('n3');
var jsonld = require('jsonld');
var configuration = require('../configuration')

function EnrichStream(options) {

  this.mapping = new R2rml(path.resolve(__dirname, '../', configuration.get('transform_folder'), configuration.get('transform_mapping')));

  this.enrich = function(data) {

    var keys = Object.keys(data);

    var mmap = new Map();
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      mmap.set(key, data[key]);

    }


    return this.mapping.transform(mmap);
  };

  // allow use without new
  if (!(this instanceof EnrichStream)) {
    return new EnrichStream(options);
  }

  // init Transform
  Transform.call(this, options);
}
util.inherits(EnrichStream, Transform);


EnrichStream.prototype._transform = function(chunk, enc, cb) {

  var change = chunk;
  change = this.enrich(change);

  var graph = {};
  var id = change[0].subject;

  graph["@id"] = id;
  for (var i = change.length - 1; i >= 0; i--) {
    var triple = change[i];

    graph[triple.predicate] = {
      "@id": triple.object
    };
  }

  var element = {};

  element["http://www.w3.org/ns/prov#generatedAtTime"] = new Date();
  element["@id"] = id;
  element["@graph"] = graph;

  this.push(element);
  cb();

};

exports = module.exports = EnrichStream;
