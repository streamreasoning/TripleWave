var path = require('path');
var request = require('request');
var fs = require('fs');
var SparqlClient = require('sparql-client-2');
var stream = require('stream');
const async = require('async');
const debug = require('debug')('SparqlDataGen')

var configuration = require('../../configuration')
var query = fs.readFileSync(path.resolve(__dirname, '../../', configuration.get('rdf_query_folder'), 'getGraphContent.q')).toString();

class SparqlDataGen extends stream.Readable {
    constructor(options) {
        super(options);

        this.firstIteration = true;
        this.endpoint = configuration.get('rdf_query_endpoint');
        this.client = new SparqlClient(this.endpoint);
        this.bindings = null;
    }

    loadData(callback) {

        var loadFile = function (callback) {

            debug('Loading the dataset file ' + configuration.get('rdf_file'));

            //'LOAD <file:../rdf/data.ttl> INTO GRAPH <http://example/input>'
            //var query = 'LOAD <file:..' + configuration.get('rdf_file') + '> INTO GRAPH <http://example/input>';

            var query = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'loadFile.q')).toString();

            query = query.split('[file]').join(configuration.get('rdf_file'));

            debug(query);

            var options = {
                url: configuration.get('rdf_update_endpoint'),
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

        var transformInput = function (callback) {

            if (configuration.get('rdf_source') === 'rdfstream') {
                console.log('No need to transform the file');
                return callback();
            }

            var hostname = configuration.get('hostname');
            var port = configuration.get('port');
            var location = configuration.get('path')||'';

            var graphName = 'http://' + (configuration.get('externaladdress') || (hostname + ':' + port + location));

            var create = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'createGraph.q')).toString();
            create = create.split('[hostname]').join(graphName);

            debug(create);
            var options = {
                url: configuration.get('rdf_update_endpoint'),
                method: 'POST',
                form: {
                    update: create
                },
                headers: {
                    Accept: 'application/ld+json'
                }
            };

            request.post(options, function (error) {
                if (error) return callback(error);

                var pattern = configuration.get('rdf_stream_item_pattern');
                //var query = fs.readFileSync('./rdf/insertQuery.q').toString();
                var query = fs.readFileSync(path.resolve(__dirname,'../../','rdf','insertQuery.q')).toString();
                query = query.split('[graphname]').join(graphName);
                query = query.split('[pattern]').join(pattern);

                debug(query);
                options.form.update = query;

                return request.post(options, callback);
            });
        };

        let _this = this;
        var createNewGraphs = function (callback) {

            if (configuration.get('rdf_source') === 'rdfstream') {
                console.log('No need to transform the file');
                return callback();
            }
            var hostname = configuration.get('hostname');
            var port = configuration.get('port');
            var location = configuration.get('path');

            var graphName = configuration.get('externaladdress') || ('http://' + hostname + ':' + port + location);

            var query = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'selectGraphs.q')).toString();
            query = query.split('[hostname]').join(graphName);

            console.log('creating the new graph');
            console.log(query);
            var client = new SparqlClient(configuration.get('rdf_query_endpoint'));

            var createNewTriples = function (triple, cb) {
                console.log(triple);
                //var insertQuery = fs.readFileSync('./rdf/insertNewTriple.q').toString();
                var insertQuery = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'insertNewTriple.q')).toString();

                var graph = triple.graph.value;
                var key = triple.key.value;

                var pattern = configuration.get('rdf_stream_item_content_pattern');
                insertQuery = insertQuery.split('[pattern]').join(pattern);
                insertQuery = insertQuery.split('?key').join('<' + key + '>');
                insertQuery = insertQuery.split('[g]').join(graph);

                var create = 'CREATE GRAPH <' + graph + '>';
                console.log(create);
                console.log(insertQuery);
                var options = {
                    url: configuration.get('rdf_update_endpoint'),
                    method: 'POST',
                    form: {
                        update: create
                    },
                    headers: {
                        Accept: 'application/ld+json'
                    }
                };

                return request.post(options, function (err, res, b) {
                    if (err) return cb(err);

                    options.form.update = insertQuery;
                    return request.post(options, function (error, response, body) {
                        if (error) return cb(error);

                        return cb();
                    });

                });

            };

            _this.client
                .query(query)
                .execute(function (err, data) {
                    if (err) return console.log(err);

                    var graphs = data.results.bindings;
                    console.log(graphs);
                    async.eachSeries(graphs, createNewTriples, function () {
                        return callback();
                    });
                });
        }

        var actions = [loadFile, transformInput, createNewGraphs];

        return async.series(actions, callback)

    };


    retrieveIndices() {
        let indQuery = fs.readFileSync(path.resolve(__dirname, '../../', configuration.get('rdf_query_folder'), 'selectGraphsWithTs.q')).toString();
        debug(indQuery);
        this.client
            .query(indQuery)
            .execute((err, data) => {
                if (err) {
                    debug(err);
                    return this.emit('error', err);
                }

                if (!data.results.bindings) {
                    debug('No graphs retrieved');
                    this.push(null);
                }
                this.bindings = data.results.bindings;
                this.sendNext();
            });
    }

    _read(num) {
        debug('this.firstIteration:', this.firstIteration, 'this.bindings:', this.bindings != null)
        if (this.firstIteration) {
            this.firstIteration = false;
            this.retrieveIndices();
        } else {
            if (this.bindings) {
                this.sendNext();
            }
        }
    }

    sendNext() {
        var b = this.bindings.pop();
        if (!b)
            return this.push(null);

        var graph = b.graph.value;
        var ts = b.ts.value;

        query = query.split('[graph]').join(graph);

        var options = {
            url: configuration.get('rdf_query_endpoint'),
            method: 'POST',
            form: {
                query: query
            },
            headers: {
                Accept: 'application/ld+json'
            }
        };

        request.post(options, (error, response, body) => {
            var element = {
                "http://www.w3.org/ns/prov#generatedAtTime": ts,
                "@id": graph,
                "@graph": JSON.parse(body)
            };
            debug(JSON.stringify(element));
            debug('adding new element');
            const shouldContinue = this.push(element);
            debug(shouldContinue)

            if (shouldContinue) {
                //                this.sendNext();
            }
        });
    }
}

module.exports = SparqlDataGen
