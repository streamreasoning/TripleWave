const Primus = require('primus');
const stream = require('stream');
const path = require('path');
const debug = require('debug')('TripleWave')
const express = require('express');

const Cache = require('./stream/cache');
const Enricher = require('./stream/enricher');
const configuration = require('./configuration');



debug('Starting up TripleWave in %s mode', configuration.get('mode'));

//to pipeline to feed the WebSocket server
let toUse = null;
let cache = new Cache(
    {
        objectMode: true,
        limit: 100

    }
);
if (configuration.get('mode') === 'replay' || configuration.get('mode') === 'endless') {
    if (configuration.get('sources') == 'rdfstream') {
        var DataGen = require('./stream/datagen/rdfStreamDataGen');
        var Scheduler = require('./stream/scheduler/rdfStreamScheduler');
    } else if (configuration.get('sources') == 'triples') {
        var DataGen = require('./stream/datagen/sparqlDataGen');
        var Scheduler = require('./stream/scheduler/rdfStreamScheduler');
    }

    debug('Using %s source', configuration.get('sources'));

    var datagen = new DataGen({
        objectMode: true,
        highWaterMark: 1
    });
    var scheduler = new Scheduler({
        objectMode: true,
        highWaterMark: 1
    });

    //compose the stream
    toUse = datagen.pipe(scheduler);
    if (configuration.get("mode") == 'endless') {
        var Replacer = require('./stream/currentTimestampReplacer');
        toUse = toUse.pipe(new Replacer({
            objectMode: true,
            highWaterMark: 1
        }));
    }

    toUse = toUse.pipe(cache);
    /*toUse = toUse.pipe(new stream.Writable({
        objectMode: true,
        write: (a, b, cb) => cb()
    }));*/

} else if (configuration.get('mode') === 'transform') {
    var Webstream = require(path.resolve(configuration.get('transform_folder'), configuration.get('transform_transformer')));

    var enricher = new Enricher(primus);
    var activeStream = new Webstream();
    enricher.pipe(cache);
    toUse = activeStream.pipe(enricher);
}

if (toUse == null) {
    debug('Using dummy data');
    var DataGen = require('./stream/datagen/dummyDataGen');
    var Scheduler = require('./stream/scheduler/dummyScheduler');
    var datagen = new DataGen({
        objectMode: true
    });
    var scheduler = new Scheduler({
        objectMode: true
    });
    toUse = datagen.pipe(scheduler);
    toUse = toUse.pipe(cache);
}


// starting up the http and websocket servers 
let app = express();

app.get('/sgraph', function (req, res) {
    return res.json(cache.getAll());
});

app.get('/id', function(req, res) {
  debug('Searching element with id ' + req.params.id);

  var element = server.cache.find(req.params.id);

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

let server = require('http').createServer(app)

let primus = Primus.createServer({
    port: configuration.get('ws_port'),
    transformer: 'websockets'
});


primus.on('initialised', () => {
    primus.on('connection', function (spark) {
        console.log("Someone connected and I'm starting to provide him data");
        toUse.pipe(spark);
    });

    primus.on('disconnection', function (spark) {
        console.log("Someone disconnected and he doesn't deserve my data anymore");
        toUse.unpipe(spark);
    });

    app.listen(configuration.get('port'), () => {
        debug('TripleWave ready');
    })
});
