var path = require('path');
var request = require('request');
var fs = require('fs');
var SparqlClient = require('sparql-client-2');
var stream = require('stream');
var $rdf = require('rdflib');
const async = require('async');
const debug = require('debug')('tw:obdaDataGen')

//var query = fs.readFileSync(path.resolve(__dirname, '../../', configuration.get('rdf_query_folder'), 'getGraphContent.q')).toString();

class OBDADataGen extends stream.Readable {
    constructor(options) {
        super(options);

        this.configuration = options.configuration;
        this.firstIteration = true;
        this.endpoint = options.configuration.get('rdf_query_endpoint');
        this.remote = options.configuration.get('rdf_remote');
        this.client = new SparqlClient(this.endpoint);
        this.bindings = null; 
    }

    retrieveIndices() {
        debug("Loading observations")
        let indQuery = fs.readFileSync(path.resolve(__dirname, '../../', this.configuration.get('rdf_query_folder'), 'obs.q')).toString();
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
        
        var query = fs.readFileSync(path.resolve(__dirname, '../../', this.configuration.get('rdf_query_folder'), 'construct.tmpl')).toString();

        var b = this.bindings.pop();

        if (!b)
            return this.push(null);

        var obs = b.o.value;
        var ts= b.time.value;

        debug("Observations Ids:\n\t",obs)

        query = query.split('$observation').join("<"+obs+">");

        //debug(query)

        var options = {
            url: this.configuration.get('rdf_query_endpoint'),
            method: 'POST',
            form: {
                query: query
            },
            headers: {
                Accept: 'application/rdf+xml'
            }
        };

        var ks = $rdf.graph()
        

        request.post(options, (error, response, body) => {
            $rdf.parse(body, ks, obs, "application/rdf+xml", (err, kb) =>{
                
                //debug(kb)

                $rdf.serialize(undefined, kb, undefined, 'application/ld+json', (error, json) => {
                debug (json)

                var jsonts = { "@value": ts,
                               "@type": "http://www.w3.org/2001/XMLSchema#dateTime" }

                var element = {
                    "http://www.w3.org/ns/prov#generatedAtTime": jsonts,
                    "@id": obs,
                    "@graph": JSON.parse(json)
                };
   
                debug("Observation:\n\t", JSON.stringify(element));
                const shouldContinue = this.push(element);

                if (shouldContinue) {
                //  this.sendNext();
                }})})
            
            

            
        });
    }
}

module.exports = OBDADataGen
