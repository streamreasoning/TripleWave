const Primus = require('primus');
const stream = require('stream');
const path = require('path');
const debug = require('debug')('TripleWave')
const express = require('express');
const async = require('async');
const JSONStream = require('JSONStream')

const Cache = require('./stream/cache');
const Enricher = require('./stream/enricher');
const configuration = require('./configuration');



debug('Starting up TripleWave in %s mode', configuration.get('mode'));


// TODO: rifarlo con le promise
let cache = null;
let toUse = null;

let createStreams = function (callback) {
    
    cache = new Cache(
        {
            objectMode: true,
            limit: 100
        }
    );

    if (configuration.get('mode') === 'replay' || configuration.get('mode') === 'endless') {
        if (configuration.get('sources') == 'rdfstream') {
            var DataGen = require('./stream/datagen/rdfStreamDataGen');
            var Scheduler = require('./stream/scheduler/rdfStreamScheduler');

            //compose the stream
            toUse = datagen.pipe(scheduler);
            if (configuration.get("mode") == 'endless') {
                var Replacer = require('./stream/currentTimestampReplacer');
                toUse = toUse.pipe(new Replacer({
                    objectMode: true,
                    highWaterMark: 1
                }));
            }

            toUse.pipe(cache);

            return callback();

        } else if (configuration.get('sources') == 'triples') {
            var DataGen = require('./stream/datagen/sparqlDataGen');
            var Scheduler = require('./stream/scheduler/rdfStreamScheduler');

            debug('Using %s source', configuration.get('sources'));

            var datagen = new DataGen({
                objectMode: true,
                highWaterMark: 1
            });
            var scheduler = new Scheduler({
                objectMode: true,
                highWaterMark: 1
            });

            return datagen.loadData(() => {
                toUse = datagen.pipe(scheduler);
                if (configuration.get("mode") == 'endless') {
                    var Replacer = require('./stream/currentTimestampReplacer');
                    toUse = toUse.pipe(new Replacer({
                        objectMode: true,
                        highWaterMark: 1
                    }));
                }

                toUse.pipe(cache);
                return callback();
            });
        }

        /*toUse = toUse.pipe(new stream.Writable({
            objectMode: true,
            write: (a, b, cb) => cb()
        }));*/

    } else if (configuration.get('mode') === 'transform') {
        let stream = path.resolve(configuration.get('transform_folder'), configuration.get('transform_transformer'));
        debug('loadgin stream %s',stream);
        var Webstream = require(stream);


        var enricher = new Enricher({
            objectMode:true
        });
        var activeStream = new Webstream({
            objectMode:true
        });
        enricher.pipe(cache);
        toUse = activeStream.pipe(enricher);

        return callback();
    }

    if (toUse === null) {
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
        toUse.pipe(cache);

        return callback();
    }

};



let startUp = function (callback) {

    // starting up the http and websocket servers 
    let app = express();

    app.get('/stream',(req,res)=>{

        toUse
        .pipe(JSONStream.stringify())
        .pipe(res);

        res.on('close',()=>{
            debug('Closing the HTTP chunk stream');
            toUse.unpipe(res);
        })
    });

    app.get('/sgraph', function (req, res) {
        return res.json(cache.getAll());
    });

    app.get('/:id', function (req, res) {
        debug('Searching element with id ' + req.params.id);

        var element = cache.find(req.params.id);

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
        primus.on('connection', (spark) => {
            debug("Someone connected and I'm starting to provide him data");
            toUse.pipe(spark);
        });

        primus.on('disconnection', (spark) => {
            debug("Someone disconnected and he doesn't deserve my data anymore");
            toUse.unpipe(spark);
        });

        app.listen(configuration.get('port'), () => {
            debug('HTTP and WebSocket servers ready');
            return callback();
        })
    });


};

async.series([createStreams, startUp], () => {
    debug('TripleWave ready');
});
