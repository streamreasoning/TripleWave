var stream = require('stream');
var util = require('util');
var _ = require('underscore');
var Transform = stream.Transform || require('readable-stream').Transform;
var PropertiesReader = require('properties-reader');
var path = require('path');
var debug = require('debug')('Cache');

var configuration = PropertiesReader(path.resolve(__dirname, '../', 'config', 'config.properties'));

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

Cache.prototype._write = function(data, enc, callback) {
  //var data = JSON.parse(chunk);
  this.add(_.extend({
    ts: new Date(data['http://www.w3.org/ns/prov#generatedAtTime']).getTime()
  }, _.pick(data, ['http://www.w3.org/ns/prov#generatedAtTime', '@id', '@graph'])));

  debug(data)
  callback();
};

Cache.prototype.add = function(element) {
  if (this.array.length === this.limit) {
    this.array.pop();
  }
  this.array.unshift(element);
};

Cache.prototype.find = function(ts) {

  var id = 'http://' + configuration.get('hostname');

  if (configuration.get('port')) {
    id += ':' + configuration.get('port');
  }

  id += configuration.get('path') + '/';

  id += ts;
  console.log(id);
  for (var i = this.array.length - 1; i >= 0; i--) {
    var e = this.array[i];

    console.log(e['@id']);
    console.log(id);

    if (e['@id'] === id) {
      return e;
    }
  }

  id = 'http://' + configuration.get('hostname');

  id += configuration.get('path') + '/';

  id += ts;
  for (var i = this.array.length - 1; i >= 0; i--) {
    var e = this.array[i];

    console.log(e['@id']);
    console.log(id);

    if (e['@id'] === id) {
      return e;
    }
  }

  return null;
};

Cache.prototype.getAll = function() {

  var array = _.clone(this.array);

  var cache = {
    "@context": {
      "sld": "http://streamreasoning.org/ontologies/SLD4TripleWave#",
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

  cache['sld:streamLocation'] = configuration.get('ws_address');
  cache['sld:tBoxLocation'] = {
    "@id": configuration.get('tbox_stream_location')
  };

  for (var i = array.length - 1; i >= 0; i--) {
    var e = array[i];
    cache['sld:contains']["@list"].push({
      generatedAt: e['http://www.w3.org/ns/prov#generatedAtTime'],
      "@id": e["@id"]
    });
  }

  if (array.length > 0) {

    cache["sld:lastUpdated"] = array[0]['http://www.w3.org/ns/prov#generatedAtTime'];
  }

  return cache;
};

exports = module.exports = Cache;