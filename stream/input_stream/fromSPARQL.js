var SparqlClient = require('sparql-client-2');
var SPARQL = SparqlClient.SPARQL;
var util = require('util');
var stream = require('stream');
var async = require('async');
var PropertiesReader = require('properties-reader');
var path = require('path');

var configuration = PropertiesReader(path.resolve(__dirname, '../../', 'config', 'config.properties'));


var city = 'Vienna';


var Transform = stream.Transform || require('readable-stream').Transform;

function SPARQLStream(options) {


  this.limit = 10;
  this.skip = 0;

  this.endpoint = configuration.get('rdf_endpoint');

  this.query = "SELECT * FROM input WHERE{ GRAPH [g] {?s ?p ?o}}";

  this.client = new SparqlClient(this.endpoint);

  var cache = [];

  var _this = this;

  var timedPush = function(data, callback) {
    console.log(data);
    _this.push(JSON.stringify(data));
    return setTimeout(callback, 1000);
  };

  this.handleResults = function(data) {

    if (!data.results.bindings) {
      this.push(null);
    }

    cache = data.results.bindings;

    async.eachSeries(cache, timedPush, function() {
      console.log('done');
    });
  };

  this.queryEndpoint = function() {
    this.client.query(this.query)
      .execute(function(error, data) {
        if (error) console.log(error);

        _this.handleResults(data);
      });
  };

  this.queryEndpoint();


  // allow use without new
  if (!(this instanceof SPARQLStream)) {
    return new SPARQLStream(options);
  }

  // init Transform
  Transform.call(this, options);
}
util.inherits(SPARQLStream, Transform);


SPARQLStream.prototype._transform = function(chunk, enc, cb) {

  cb();
};



exports = module.exports = SPARQLStream;