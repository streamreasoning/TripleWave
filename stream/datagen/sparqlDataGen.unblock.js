var SparqlClient = require('sparql-client-2');
var SPARQL = SparqlClient.SPARQL;
var util = require('util');
var stream = require('stream');
var async = require('async');
var PropertiesReader = require('properties-reader');
var path = require('path');
var request = require('request');
var fs = require('fs');

var configuration = require('../../configuration')

class SparqlDataGen extends stream.Readable {
    constructor(options) {
        super(options);

        this.endpoint = configuration.get('rdf_query_endpoint');
        this.query = fs.readFileSync(path.resolve(__dirname, '../../', 'rdf', 'selectGraphsWithTs.q')).toString();
        this.client = new SparqlClient(this.endpoint);

        var cache = [];
        var hostname = configuration.get('hostname');

        this.client
            .query(this.query)
            .execute((err, data) => {
                if (err) throw err;

                if (!data.results.bindings) {
                    console.log('No graphs retrieved');
                    this.push(null);
                }

                //for each graph, create the stream item and push it
                for (var i = 0; i < data.results.bindings.length; i++) {
                    var b = data.results.bindings[i];
//                    console.log(b);

                    var graph = b.graph.value;
                    var ts = b.ts.value;

                    var query = fs.readFileSync(path.resolve(__dirname, '../../', 'rdf', 'getGraphContent.q')).toString();
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
//                        console.log(JSON.stringify(element));
                        console.log('adding new element');
                        this.push(JSON.stringify(element))
                    });
                }
            });


    }

    _read(num) {

    }
}

module.exports = SparqlDataGen
