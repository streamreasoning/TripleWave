/**
 * Module dependencies.
 */

var WikiStream = require("./stream/input_stream/wikiStream.js");
var Enricher = require("./stream/enricher.js");
var Cache = require("./stream/cache.js");
var FromSPARQL = require('./stream/input_stream/fromSPARQL.js');
var Transformer = require('./stream/transformer.js');

var PropertiesReader = require('properties-reader');
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var errorhandler = require('errorhandler');
var bodyParser = require('body-parser');
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

app.get('/TripleWave/wiki.json', function(req, res) {

  console.log('Connection');

  server.enricher.pipe(res);

  res.on('close', function() {
    server.enricher.unpipe(res);
  });


});

app.get('/TripleWave/sGraph', function(req, res) {
  return res.json(server.cache.getAll());
});

app.get('/TripleWave/replay', function(req, res) {

  var fromSPARQL = new FromSPARQL();
  fromSPARQL.pipe(res);

  res.on('close', function() {
    fromSPARQL.unpipe(res);
  });

});

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

app.listen(app.get('port'), function() {

  server.cache = new Cache({});
  server.enricher = new Enricher(server);
  server.activeStream = new WikiStream();
  server.activeStream.pipe(server.enricher);
  server.enricher.pipe(server.cache);

  console.log('Filter server listening on port ' + app.get('port'));
});