/**
 * Module dependencies.
 */

var WikiStream = require("./wikiStream.js");
var Enricher = require("./enricher.js");
var Cache = require("./cache.js");

var express = require('express');
var http = require('http');
var path = require('path');
var errorhandler = require('errorhandler');
var bodyParser = require('body-parser');
var app = express();

// all environments
app.set('port', 7654);
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

app.get('/TripleRush/wiki.json', function(req, res) {

  console.log('Connection');

  server.enricher.pipe(res);

  res.on('close', function() {
    enricher.unpipe(res);
  });


});

app.get('/sGraph', function(req, res) {
  return res.json(server.cache.getAll());
});

app.get('/:ts', function(req, res) {
  console.log('Searching element with ts ' + req.params.ts);

  var element = server.cache.find(req.params.ts);

  if (element) {
    res.json(element);
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