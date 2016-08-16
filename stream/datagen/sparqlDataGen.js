var path = require('path');
var request = require('request');
var fs = require('fs');
var SparqlClient = require('sparql-client-2');
var stream = require('stream');
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

    retrieveIndices() {
        let indQuery = fs.readFileSync(path.resolve(__dirname, '../../', configuration.get('rdf_query_folder'), 'selectGraphsWithTs.q')).toString();
        this.client
            .query(indQuery)
            .execute((err, data) => {
                if (err)
                    return this.emit('error', err);

                if (!data.results.bindings) {
                    debug('No graphs retrieved');
                    this.push(null);
                }
                this.bindings = data.results.bindings;
                this.sendNext();
            });
    }

    _read(num) {
        debug('this.firstIteration:', this.firstIteration, 'this.bindings:', this.bindings!=null)
        if (this.firstIteration) {
            this.firstIteration = false;
            this.retrieveIndices();
        } else {
            if(this.bindings){
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
            //                        debug(JSON.stringify(element));
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
