/**
 * Module dependencies.
 */

var Enricher = require("./stream/enricher.js");
var Cache = require("./stream/cache.js");
var FromSPARQL = require('./stream/input_stream/fromSPARQL.js');
var Transformer = require('./stream/transformer.js');

var PropertiesReader = require('properties-reader');
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var request = require('request');
var errorhandler = require('errorhandler');
var bodyParser = require('body-parser');
var async = require('async');
var SparqlClient = require('sparql-client-2');
var SPARQL = SparqlClient.SPARQL;

var app = express();

//var configuration = require('./config/config.json');
var configuration = PropertiesReader(path.resolve(__dirname, 'config', 'config.properties'));

// all environments
app.set('port', configuration.get('port'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(bodyParser.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());
//app.use(express.static(path.join(__dirname, 'public')));

// development only
var server = {

};

app.get('/TripleWave/test', function(req, res) {

  var transformer = new Transformer();

  var lines = fs.readFileSync('./r2rml-js/lsd_small.csv').toString().split('\n');

  var data = [];
  var labels = lines[0].split(',');

  for (l = 1; l < lines.length; l++) {
    var line = lines[l].split(',');
    console.log(line);
    var mmap = {};
    for (i = 0; i < labels.length; i++) {
      console.log(line[i]);
      mmap[labels[i]] = line[i];
    }

    data.push(mmap);
  }

  return res.json(data);

});

if (configuration.get('mode') === 'replay' || configuration.get('mode') === 'endless') {

  app.get('/TripleWave/replay', function(req, res) {

    var fromSPARQL = new FromSPARQL();
    fromSPARQL.pipe(res);

    res.on('close', function() {
      fromSPARQL.unpipe(res);
    });

  });
}

if (configuration.get('mode') === 'transform') {

  app.get('/TripleWave/stream.json', function(req, res) {

    console.log('Connection');

    server.enricher.pipe(res);

    res.on('close', function() {
      server.enricher.unpipe(res);
    });


  });

  app.get('/TripleWave/sGraph', function(req, res) {
    return res.json(server.cache.getAll());
  });



  app.get('/TripleWave/:ts', function(req, res) {
    console.log('Searching element with ts ' + req.params.ts);

    var element = server.cache.find(req.params.ts);

    if (element) {
      res.json({
        "@graph": element["@graph"]
      });
    } else {
      res.status = 404;
      res.json({
        error: "Element not found"
      });
    }
  });


  if ('development' == app.get('env')) {
    app.use(errorhandler());
  }

}


var loadFile = function(callback) {

  console.log('Loading the dataset file ' + configuration.get('rdf_file'));

  //'LOAD <file:../rdf/data.ttl> INTO GRAPH <http://example/input>'
  var query = 'LOAD <file:..' + configuration.get('rdf_file') + '> INTO GRAPH <http://example/input>';

  var options = {
    url: 'http://localhost:3030/ds/update',
    method: 'POST',
    form: {
      update: query
    },
    headers: {
      Accept: 'application/ld+json'
    }
  };

  return request.post(options, callback);

};


var transformInput = function(callback) {

  if (configuration.get('rdf_source') === 'rdfstream') {
    console.log('No need to transform the file');
    return callback();
  }

  var create = 'CREATE GRAPH <http://example.org/sgraph>';

  var options = {
    url: 'http://localhost:3030/ds/update',
    method: 'POST',
    form: {
      update: create
    },
    headers: {
      Accept: 'application/ld+json'
    }
  };

  request.post(options, function(error) {
    if (error) return callback(error);

    var query = fs.readFileSync('./rdf/insertQuery.q').toString();

    options.form.update = query;

    return request.post(options, callback);
  });
};


var createNewGraphs = function(callback) {

  if (configuration.get('rdf_source') === 'rdfstream') {
    console.log('No need to transform the file');
    return callback();
  }

  var query = 'SELECT DISTINCT ?graph ?key FROM <http://example.org/sgraph> where {?graph <http://example.org/hasKey> ?key}';

  var client = new SparqlClient('http://localhost:3030/ds/query');

  var createNewTriples = function(triple, cb) {

    var insertQuery = fs.readFileSync('./rdf/insertNewTriple.q').toString();

    var graph = triple.graph.value;
    var key = triple.key.value;

    insertQuery = insertQuery.split('[g]').join(graph);
    insertQuery = insertQuery.split('[k]').join(key);

    var create = 'CREATE GRAPH <' + graph + '>';

    var options = {
      url: 'http://localhost:3030/ds/update',
      method: 'POST',
      form: {
        update: create
      },
      headers: {
        Accept: 'application/ld+json'
      }
    };

    return request.post(options, function(err, res, b) {
      if (err) return cb(err);

      options.form.update = insertQuery;
      return request.post(options, function(error, response, body) {
        if (error) return cb(error);

        return cb();
      });

    });


  };

  client
    .query(query)
    .execute(function(err, data) {
      if (err) return console.log(err);

      var graphs = data.results.bindings;
      console.log(graphs);
      async.eachSeries(graphs, createNewTriples, function() {
        return callback();
      });
    });



};

app.listen(app.get('port'), function() {

  if (configuration.get('mode') === 'transform') {
    console.log('Transform mode');
    console.log('Setting up the required streams');
    var Webstream = require(path.resolve('stream', 'input_stream', configuration.get('stream_name')));

    server.cache = new Cache({});
    server.enricher = new Enricher(server);
    server.activeStream = new Webstream();
    server.activeStream.pipe(server.enricher);
    server.enricher.pipe(server.cache);
    console.log('TripleWave listening on port ' + app.get('port'));

  } else {
    console.log('Loading the rdf dataset (TODO)');

    var actions = [loadFile, transformInput, createNewGraphs];

    async.series(actions, function(err) {
      if (err) throw err;

      console.log('TripleWave listening on port ' + app.get('port'));
    });

  }

});