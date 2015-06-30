var stream = require('stream');
var util = require('util');
var _ = require('underscore');
var Transform = stream.Transform || require('readable-stream').Transform;

function Cache(options) {

  if (!(this instanceof Cache)) {
    return new Cache(options);
  }

  this.array = [];
  this.limit = options.limit || 100;

  // init Transform
  Transform.call(this, options);

}
util.inherits(Cache, Transform);

Cache.prototype._write = function(chunk, enc, callback) {
  var data = JSON.parse(chunk);
  this.add(_.extend({
    ts: new Date(data['http://example.com/#generatedAt']).getTime()
  }, _.pick(data, ['http://example.com/#generatedAt', '@id', '@graph'])));

  callback();
};

Cache.prototype.add = function(element) {
  if (this.array.length === this.limit) {
    this.array.pop();
  }
  this.array.unshift(element);
};

Cache.prototype.find = function(ts) {
  ts = parseInt(ts);
  for (var i = this.array.length - 1; i >= 0; i--) {
    var e = this.array[i];
    console.log(e);
    if (e.ts === ts) {
      return e;
    }
  }
  return null;
};

Cache.prototype.getAll = function() {

  var array = _.clone(this.array);

  if (array.length === 0) {
    return {};
  }

  var cache = {
    "@context": {
      "sld": "http://streamreasoning.org/ontology/SLD#",
      "tr": "http://131.175.141.249/",
      "generatedAt": {
        "@id": "http://www.w3.org/ns/prov#generatedAtTime",
        "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
      }
    },
    "@id": "tr:sGraph",
    "sld:contains": {
      "@list": []
    }
  };

  for (var i = array.length - 1; i >= 0; i--) {
    var e = array[i];
    cache['sld:contains']["@list"].push({
      generatedAt: e['http://example.com/#generatedAt'],
      "@id": "tr:" + e.ts
    });
  }

  cache["sld:lastUpdated"] = array[0]['http://example.com/#generatedAt'];

  return cache;
};

exports = module.exports = Cache;