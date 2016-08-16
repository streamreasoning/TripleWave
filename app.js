//fixed
var Primus = require('primus');
var stream = require('stream');

var configuration = require('./configuration');

//the WebSocket server
var primus = Primus.createServer({
    iknowhttpsisbetter: true,
    port: configuration.get('ws_port'),
    transformer: 'websockets'
});

//to pipeline to feed the WebSocket server
let toUse = null;
if (configuration.get('mode') === 'replay' || configuration.get('mode') === 'endless') {
    if (configuration.get('sources') == 'rdfstream') {
        var DataGen = require('./stream/datagen/rdfStreamDataGen');
        var Scheduler = require('./stream/scheduler/rdfStreamScheduler');
    } else if (configuration.get('sources') == 'triples') {
        var DataGen = require('./stream/datagen/sparqlDataGen');
        var Scheduler = require('./stream/scheduler/rdfStreamScheduler');
    }

    var datagen = new DataGen({objectMode: true,  highWaterMark: 1 });
    var scheduler = new Scheduler({objectMode: true,  highWaterMark: 1 });

    toUse = datagen.pipe(scheduler).pipe(new stream.Writable({
      objectMode: true,
      write: (a, b, cb) => cb()
    }));
} else if (configuration.get('mode') === 'transform') {
    var Webstream = require(path.resolve('stream', 'input_stream', configuration.get('stream_name')));

    var cache = new Cache({});
    var enricher = new Enricher(primus);
    var activeStream = new Webstream();
    enricher.pipe(cache);
    toUse = activeStream.pipe(enricher);
}

if(toUse == null){
    var DataGen = require('./stream/datagen/dummyDataGen');
    var Scheduler = require('./stream/scheduler/dummyScheduler');
    var datagen = new DataGen({objectMode: true});
    var scheduler = new Scheduler({objectMode: true});
    toUse = datagen.pipe(scheduler);
}

primus.on('connection', function(spark) {
    console.log("Someone connected and I'm starting to provide him data");
    toUse.pipe(spark);
});

primus.on('disconnection', function(spark) {
    console.log("Someone disconnected and he doesn't deserve my data anymore");
    toUse.unpipe(spark);
});
