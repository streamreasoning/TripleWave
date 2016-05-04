---
category: Use modes
path: 
title: 'Run TripleWave to convert a Web stream'
type: 'Transform'

layout: nil
---

TripleWave allows to generate an RDF stream from an existing stream from the Web. As an example, consider the change stream of [Wikipedia](https://en.wikipedia.org/wiki/Special:RecentChanges). This stream features all the changes that occur on the Wikipedia website. It comprehends not only elements related to the creation or modification of pages (e.g., articles and books), but also events related to users (new registrations and blocked users), and discussions among them. 

For example the following JSON excerpt (collected with the API provided [here](https://github.com/edsu/wikistream)) shows a fragment of the stream of changes of Wikipedia. In particular, it shows that the user `Jmorrison230582` modified an article of the English Wikipedia about `Naruto: Ultimate Ninja`. Furthermore, the delta attribute tell us that the user deleted some words, and the `url` attribute refers the to the Wikipedia page that describes the event.


    { 
      "page": "Naruto: Ultimate Ninja",
      "pageUrl": "http://en.wikipedia.org/wiki/Naruto:_Ultimate_Ninja",
      "url": "https://en.wikipedia.org/w/index.php?diff=669355471&oldid=669215360",
      "delta": -7, "comment": "/ Characters /",
      "wikipediaUrl": "http://en.wikipedia.org", 
      "channel": "#en.wikipedia", 
      "wikipediaShort": "en",
      "user": "Jmorrison230582", 
      "userUrl": "http://en.wikipedia.org/wiki/User/Jmorrison230582",
      "unpatrolled": false, 
      "newPage": false, 
      "robot": false,
      "namespace": "article" 
    }


In order to transform a web stream you need two components:

* A connector to the web stream
* A R2RML tranformation

### Web Stream Connector

A Web Stream connector is a Javascript file that needs to transform data retrieved from some web API to a NodeJS stream.

Basically what you need to do is to implement a [Transform Stream](https://nodejs.org/api/stream.html#stream_class_stream_transform) (a Readable stream is fine too)

Let's have a look at the Wikipedia example:


    var stream = require('stream');
    var util = require('util');
    var wikichanges = require("wikichanges");

    var Transform = stream.Transform || require('readable-stream').Transform;

    function WikiStream(options) {
      // allow use without new
      if (!(this instanceof WikiStream)) {
        return new WikiStream(options);
      }

      this.close = false;
      this.w = new wikichanges.WikiChanges({
        ircNickname: "jsonLDBot",
        wikipedias: ["#en.wikipedia"]
      });
      _this = this;

      this.w.listen(function(c) {
         if (!_this.close) {
           _this.push(JSON.stringify(c));
         } else {
            _this.push(null);
         }
      });

      // init Transform
      Transform.call(this, options);
    }

    util.inherits(WikiStream, Transform);

    WikiStream.prototype._read = function(enc, cb) {};

    WikiStream.prototype.closeStream = function() {
      this.close = true;
    };
    exports = module.exports = WikiStream;

The lines `var stream = require('stream'); var util = require('util');` are needed for requiring the stream module and the util module that is needed to implement the inheritance

Then, `var Transform = stream.Transform || require('readable-stream').Transform;` requires the actual Transform stream class

Then all the logic is implemented inside the `WikiStream` function

Whenever you want to put some data in the stream you need to call the `this.push(/* some data*/) function (remember that in the stream you can pass only strings)

In this particular example the code works like this:

`var wikichanges = require("wikichanges");` requires the library to connect to the stream of changes of wikipedia

The code

    this.w = new wikichanges.WikiChanges({
        ircNickname: "jsonLDBot",
        wikipedias: ["#en.wikipedia"]
    });

opens the stream.

Then with the lines


    this.w.listen(function(c) {
      if (!_this.close) {
        _this.push(JSON.stringify(c));
      } else {
        _this.push(null);
      }
    });

we create a handler that put the data in our stream whenever they are available from Wikipedia

In order to use a custom stream you need to put your file in the `stream/input_stream` folder, and then set the `stream_name` parameter in the configuration file equal to the name of your .js file

Furthermore you can use the `SampleStream.js` file as a stub to create your own connector.

### R2RML Transformation

To adapt and transform Web streams to RDF streams we use a generic transformation process that is specified as [R2RML](http://www.w3.org/TR/r2rml/) mappings. The example below specifies how a Wikipedia stream update can be mapped to a graph of an RDF stream. This mapping defines first a triple that indicates that the generated subject is of type `schema:UpdateAction`. The `predicateObjectMap` clauses add two more triples, one specifying the object of the update (e.g. the modified wiki page) and the author of the update.

    :wikiUpdateMap a rr:TriplesMap; rr:logicalTable :wikistream;
      rr:subjectMap [ rr:template "http://131.175.141.249/TripleWave/{time}"; 
                      rr:class schema:UpdateAction; rr:graphMap :streamGraph ];
      rr:predicateObjectMap [rr:predicate schema:object; 
                             rr:objectMap [ rr:column "pageUrl" ]];     		   		  
      rr:predicateObjectMap [rr:predicate schema:agent;  
                             rr:objectMap [ rr:column "userUrl"] ];.


Additional mappings can be specified, as in the example below, for providing more information about the user (e.g. user name):


     :wikiUserMap a rr:TriplesMap; rr:logicalTable :wikistream; 
       rr:subjectMap   [ rr:column "userUrl"; 
                    rr:class schema:Person; rr:graphMap :streamGraph ];
       rr:predicateObjectMap [ rr:predicate schema:name; 
                               rr:objectMap [ rr:column "user" ]];.  


A snippet of the resulting RDF Stream graph, serialized in JSON-LD, is shown below.


    {"http://www.w3.org/ns/prov#generatedAtTime": "2015-06-30T16:44:59.587Z",
      "@id": "http://131.175.141.249/TripleWave/1435682699587",
      "@graph": [ 
        { "@id": "http://en.wikipedia.org/wiki/User:Jmorrison230582",
          "@type": "https://schema.org/Person",
          "name": "Jmorrison230582" },
        { "@id": "http://131.175.141.249/TripleWave/1435682699587",
          "@type": "https://schema.org/UpdateAction",
          "object": {"@id": "http://en.wikipedia.org/wiki/Naruto_Ultimate_Ninja"},
          "agent":  {"@id": "http://en.wikipedia.org/wiki/User:Jmorrison230582"}
        }
      ],
     "@context": "https://schema.org/"  
    }


In order to use your transformation you need to put the R2RML file in the `transformation` folder and set the `stream_mapping` parameter as the name of the transformation file.
