var path = require('path');
var request = require('request');
var fs = require('fs');
var SparqlClient = require('sparql-client-2');
var stream = require('stream');
const async = require('async');
const debug = require('debug')('SparqlDataGen')

//var query = fs.readFileSync(path.resolve(__dirname, '../../', configuration.get('rdf_query_folder'), 'getGraphContent.q')).toString();

class SparqlDataGen extends stream.Readable {
    constructor(options) {
        super(options);

        this.configuration = options.configuration;
        this.firstIteration = true;
        this.endpoint = options.configuration.get('rdf_query_endpoint');
        this.remote = options.configuration.get('rdf_remote');
        this.client = new SparqlClient(this.endpoint);
        this.bindings = null;

    }

    loadData(callback) {
        
        let _this = this;
        var loadFile = function (callback) {

            debug('Loading the dataset file ' + _this.configuration.get('rdf_file'));

            //'LOAD <file:../rdf/data.ttl> INTO GRAPH <http://example/input>'
            //var query = 'LOAD <file:..' + _this.configuration.get('rdf_file') + '> INTO GRAPH <http://example/input>';

            var query = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'loadFile.q')).toString();

            query = query.split('[file]').join(_this.configuration.get('rdf_file'));

            debug(query);

            var options = {
                url: _this.configuration.get('rdf_update_endpoint'),
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

            if (_this.configuration.get('rdf_source') === 'rdfstream') {
                debug('No need to transform the file');
                return callback();
            }

            var hostname = _this.configuration.get('hostname');
            var port = _this.configuration.get('port');
            var location = _this.configuration.get('path')||'';

            var graphName = 'http://' + (_this.configuration.get('externaladdress') || (hostname + ':' + port + location));


            var create = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'createGraph.q')).toString();
            create = create.split('[hostname]').join(graphName);

            debug(create);
            var options = {
                url: _this.configuration.get('rdf_update_endpoint'),
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

                //var pattern = _this.configuration.get('rdf_stream_item_pattern');
                //var query = fs.readFileSync('./rdf/insertQuery.q').toString();
                //var query = fs.readFileSync(path.resolve(__dirname,'../../','rdf','insertQuery.q')).toString();
                //query = query.split('[graphname]').join(graphName);
                //query = query.split('[pattern]').join(pattern);

                var queryPath = _this.configuration.get('rdf_insert_query');
                
                var query = fs.readFileSync(path.resolve(__dirname,'../',queryPath)).toString();
                query = query.split('[graphname]').join(graphName);
                debug(query);
                options.form.update = query;

                return request.post(options, callback);
            });
        };

        var createNewGraphs = function (callback) {

            if (_this.configuration.get('rdf_source') === 'rdfstream') {
                debug('No need to transform the file');
                return callback();
            }
            var hostname = _this.configuration.get('hostname');
            var port = _this.configuration.get('port');
            var location = _this.configuration.get('path');

            var graphName = _this.configuration.get('externaladdress') || ('http://' + hostname + ':' + port + location);

            var query = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', 'selectGraphs.q')).toString();
            query = query.split('[hostname]').join(graphName);

            debug('creating the new graph');
            debug(query);
            var client = new SparqlClient(_this.configuration.get('rdf_query_endpoint'));

            var createNewTriples = function (triple, cb) {
                debug(triple);
                //var insertQuery = fs.readFileSync('./rdf/insertNewTriple.q').toString();
                var insertQueryPath = _this.configuration.get('rdf_insert_new_triple')
                var insertQuery = fs.readFileSync(path.resolve(__dirname,'../',insertQueryPath)).toString();

                var graph = triple.graph.value;
                var key = triple.key.value;

               // var pattern = _this.configuration.get('rdf_stream_item_content_pattern');
               // insertQuery = insertQuery.split('[pattern]').join(pattern);
                insertQuery = insertQuery.split('?key').join('<' + key + '>');
                insertQuery = insertQuery.split('[g]').join(graph);

                var create = 'CREATE GRAPH <' + graph + '>';
                debug(create);
                debug(insertQuery);
                var options = {
                    url: _this.configuration.get('rdf_update_endpoint'),
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
                    if (err) return debug(err);

                    var graphs = data.results.bindings;
                    debug(graphs);
                    async.eachSeries(graphs, createNewTriples, function () {
                        return callback();
                    });
                });
        }

        var actions; 
        
        if(!this.remote){
            actions = [loadFile, transformInput, createNewGraphs];
        }else{
            actions = [transformInput, createNewGraphs];
        }

        return async.series(actions, callback)

    };


    retrieveIndices() {
        let indQuery = fs.readFileSync(path.resolve(__dirname, '../../', "rdf/triples", 'selectGraphsWithTs.q')).toString();
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
        
        var query;
        if(this.configuration.get('rdf_guery_get_content')){
            query = this.configuration.get('rdf_guery_get_content')
        } else{
            query = fs.readFileSync(path.resolve(__dirname, '../../', "rdf/triples", 'getGraphContent.q')).toString();
        }

        var b = this.bindings.pop();
        if (!b)
            return this.push(null);

        var graph = b.graph.value;
        var ts = b.ts.value;

        query = query.split('[graph]').join(graph);

        var options = {
            url: this.configuration.get('rdf_query_endpoint'),
            method: 'POST',
            form: {
                query: query
            },
            headers: {
                Accept: 'application/ld+json'
            }
        };

        request.post(options, (error, response, body) => {

            var processingTime = { "@value": ts,
                               "@type": "http://www.w3.org/2001/XMLSchema#dateTime" }

            var eventTime = { "@value": ts,
                               "@type": "http://www.w3.org/2001/XMLSchema#dateTime" }

            var element = {
                    "http://www.w3.org/ns/prov#generatedAtTime": processingTimepro,
                    "http://www.streamreasoning.org/vois#eventTime": eventTime,
                    "@id": graph,
                    "@graph": JSON.parse(body)
            };
   
            debug(JSON.stringify(element));
            debug('adding new element');
            const shouldContinue = this.push(element);
            debug(shouldContinue)
        });
    }
}

module.exports = SparqlDataGen
