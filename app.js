const Primus = require('primus');
const stream = require('stream');
const path = require('path');
const debug = require('debug')('TripleWave')
const express = require('express');
const async = require('async');
const JSONStream = require('JSONStream')
const program = require('commander');

const Cache = require('./stream/cache');
const Enricher = require('./stream/enricher');
const MQTTOut = require('./stream/mqttOutput')
var configuration;

// TODO: rifarlo con le promise
let cache = null;
let toUse = null;

let parseCommandLine = function (callback) {
    program
        .option('-m, --mode [mode]', 'TripleWave running mode', /^(transform|endless|replay)$/i)
        .option('-c, --configuration [configuration]', 'Path to the configuration file')
        .option('-s, --sources [sources]', 'Source of the data')
        .option('--fuseki [fuseki]', 'Fuseki PID')
        .parse(process.argv);

    configuration = require('./configuration')(program.configuration);
    program.mode ? configuration.set('mode', program.mode) : null;
    program.sources ? configuration.set('sources', program.sources) : null;

    debug(configuration.get('mode'));
    debug(configuration.get('sources'));
    return callback();
}

let createStreams = function (callback) {

    if (configuration.get('mode') === 'replay' || configuration.get('mode') === 'endless') {
        if (configuration.get('sources') === 'rdfstream') {

            let buildStream = function () {

                cache = new Cache(
                    {
                        objectMode: true,
                        limit: 100,
                        configuration: configuration
                    }
                );

                var DataGen = require('./stream/datagen/rdfStreamDataGen');
                var Scheduler = require('./stream/scheduler/rdfStreamScheduler');
                var IdReplacer = require('./stream/idReplacer');

                var datagen = new DataGen({
                    objectMode: true,
                    highWaterMark: 1,
                    configuration: configuration
                });
                var scheduler = new Scheduler({
                    objectMode: true,
                    highWaterMark: 1,
                    configuration: configuration
                });

                var idReplacer = new IdReplacer({
                    objectMode: true,
                    configuration: configuration
                });

                //compose the stream
                toUse = datagen.pipe(scheduler);
                toUse = toUse.pipe(idReplacer);
                if (configuration.get("mode") == 'endless') {
                    var Replacer = require('./stream/currentTimestampReplacer');
                    toUse = toUse.pipe(new Replacer({
                        objectMode: true,
                        highWaterMark: 1
                    }));

                    toUse.on('end', () => {
                        debug("Stream ended")

                        buildStream();

                        debug('Restarted');
                    });
                }
                toUse.pipe(cache);


            };

            buildStream();

            return callback();
        } else if (configuration.get('sources') === 'triples') {
            var DataGen = require('./stream/datagen/sparqlDataGen');
            var Scheduler = require('./stream/scheduler/rdfStreamScheduler');
            debug('Using %s source', configuration.get('sources'));

            let buildStream = function (restart) {

                cache = new Cache(
                    {
                        objectMode: true,
                        limit: 100,
                        configuration: configuration
                    }
                );

                var datagen = new DataGen({
                    objectMode: true,
                    highWaterMark: 1,
                    configuration: configuration
                });
                var scheduler = new Scheduler({
                    objectMode: true,
                    highWaterMark: 1,
                    configuration: configuration
                });

                if (!restart) {
                    return datagen.loadData(() => {
                        toUse = datagen.pipe(scheduler);
                        if (configuration.get("mode") == 'endless') {
                            var Replacer = require('./stream/currentTimestampReplacer');
                            toUse = toUse.pipe(new Replacer({
                                objectMode: true,
                                highWaterMark: 1
                            }));

                            toUse.on('end', () => {
                                debug("Restarting the stream");
                                buildStream(true);
                            })
                        }

                        toUse.pipe(cache);
                        return callback();
                    });
                } else {

                    // Don't check if TW is in endless mode since this branch is only executed in endless mode
                    toUse = datagen.pipe(scheduler);
                    var Replacer = require('./stream/currentTimestampReplacer');
                    toUse = toUse.pipe(new Replacer({
                        objectMode: true,
                        highWaterMark: 1
                    }));
                    toUse.pipe(cache);

                    toUse.on('end', () => {
                        debug("Restarting the stream");
                        buildStream(true);
                    })
                }
            }

            return buildStream(false);
        }

        /*toUse = toUse.pipe(new stream.Writable({
            objectMode: true,
            write: (a, b, cb) => cb()
        }));*/

    } else if (configuration.get('mode') === 'transform') {

        cache = new Cache(
            {
                objectMode: true,
                limit: 100,
                configuration: configuration
            }
        );
        let stream = path.resolve(configuration.get('transform_folder'), configuration.get('transform_transformer'));
        debug('Loading stream %s', stream);
        var Webstream = require(stream);

        let IdReplacer = require('./stream/idReplacer');

        var enricher = new Enricher({
            objectMode: true,
            configuration: configuration
        });
        var activeStream = new Webstream({
            objectMode: true,
            configuration: configuration
        });
        var idReplacer = new IdReplacer({
            objectMode: true,
            configuration: configuration
        });

        toUse = activeStream.pipe(enricher);
        toUse = toUse.pipe(idReplacer);
        toUse.pipe(cache);

        return callback();
    }

    if (toUse === null) {
        debug('Using dummy data');
        var DataGen = require('./stream/datagen/dummyDataGen');
        var Scheduler = require('./stream/scheduler/dummyScheduler');
        var datagen = new DataGen({
            objectMode: true,
            configuration: configuration
        });
        var scheduler = new Scheduler({
            objectMode: true,
            configuration: configuration
        });
        toUse = datagen.pipe(scheduler);
        toUse.pipe(cache);

        return callback();
    }

};



let startUp = function (callback) {

    // starting up the http and websocket servers 
    let app = express();

    app.get('/stream', (req, res) => {

        toUse
            .pipe(JSONStream.stringify())
            .pipe(res);

        res.on('close', () => {
            debug('Closing the HTTP chunk stream');
            toUse.unpipe(res);
        })
    });

    app.get('/', function(req, res) {
        return res.json(cache.getAll());
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

    if(configuration.get('mqtt_enabled')){
        debug('MQTT is enabled, connecting to the broker');
        let mqttServer = new MQTTOut({
		    objectMode: true,
                    configuration: configuration});
        toUse.pipe(mqttServer);
    }

    if(configuration.get('ws_enabled')){
        debug('WS is enabled, setting up the server');

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
    } else {
        app.listen(configuration.get('port'), () => {
           debug('HTTP and WebSocket servers ready');
           return callback();
        });
    }
};

async.series([parseCommandLine, createStreams, startUp], () => {
    debug('TripleWave ready');
});
