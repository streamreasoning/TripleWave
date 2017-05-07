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
        let indQuery = fs.readFileSync(path.resolve(__dirname, '../../', "rdf/stream", 'obs.q')).toString();
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
        
        var query = fs.readFileSync(path.resolve(__dirname, '../../', "rdf/stream", 'construct.tmpl')).toString();

        var b = this.bindings.pop();

        if (!b)
            return this.push(null);

        var obs = b.o.value;
        var ts= b.time.value;

        debug("Observations Ids:\n\t",obs)

        query = query.split('$observation').join("<"+obs+">");

        debug(query)

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

                var hostname = this.configuration.get('hostname');
                var port = this.configuration.get('port');
                var location = this.configuration.get('path')||'';
                var stream_name = this.configuration.get('stream_name');

                $rdf.serialize(undefined, kb, undefined, 'application/ld+json', (error, json) => {
                debug (json)

                var processingTime = { "@value": ts,
                               "@type": "http://www.w3.org/2001/XMLSchema#dateTime" }  

                var eventTime = { "@value": ts,
                               "@type": "http://www.w3.org/2001/XMLSchema#dateTime" }

                var id_new = 'http://' + (this.configuration.get('externaladdress') || (hostname + ':' + port + location));
                new_id = id_new + obs.split(stream_name)[1]

                debug(new_id)

                var element = {
                    "@context": {
                        "ct":"http://www.insight-centre.org/citytraffic#",
                        "dr":"http://www.insight-centre/DataRequest#",
                        "ces":"http://www.insight-centre.org/ces#",
                        "dul":"http://www.loa.istc.cnr.it/ontologies/DUL.owl#",
                        "owl":"http://www.w3.org/2002/07/owl#",
                        "rdf":"http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                        "ses":"http://www.insight-centre.org/dataset/SampleEventService#",
                        "ssn":"http://purl.oclc.org/NET/ssnx/ssn#",
                        "xml":"http://www.w3.org/XML/1998/namespace",
                        "xsd":"http://www.w3.org/2001/XMLSchema#",
                        "prof":"http://www.daml.org/services/owl-s/1.2/Profile.owl#",
                        "rdfs":"http://www.w3.org/2000/01/rdf-schema#",
                        "service":"http://www.daml.org/services/owl-s/1.2/Service.owl#",
                        "servicep":"http://www.daml.org/services/owl-s/1.2/ServiceParameter.owl#",
                        "grounding": "http://www.daml.org/services/owl-s/1.2/Grounding.owl#",
                        "sld": "http://streamreasoning.org/ontologies/SLD4TripleWave#",
                          "generatedAt": {
                            "@id": "http://www.w3.org/ns/prov#generatedAtTime",
                            "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
                          }
                    },
                    "http://www.w3.org/ns/prov#generatedAtTime": processingTime,
                    "http://www.streamreasoning.org/sld#eventTime": eventTime,
                    "@id": new_id,
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
