/**
 * Module dependencies.
 */

var WikiStream = require("./wikiStream.js");
var Enricher = require("./enricher.js");
var express = require('express');
var http = require('http');
var path = require('path');
var errorhandler = require('errorhandler');
var bodyParser = require('body-parser');
var app = express();

// all environments
app.set('port', 7654);
app.set('hostname', '131.175.141.249');
app.set('externalUrl', '131.175.141.249');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(bodyParser.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());
//app.use(app.router);
//app.use(express.static(path.join(__dirname, 'public')));

// development only

var activeStream;

app.get('/wiki.json', function(req, res) {

  console.log('Connection');
  var enricher = new Enricher();
  activeStream.pipe(enricher).pipe(res);
});

if ('development' == app.get('env')) {
  app.use(errorhandler());
}

http.createServer(app).listen(app.get('port'), function() {
  console.log('Filter server listening on port ' + app.get('port'));
  activeStream = new WikiStream();
});