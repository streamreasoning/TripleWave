var stream = require('stream');
var util = require('util');
var _ = require('underscore');
var R2rml = require('../r2rml-js/r2rml.js');
var PropertiesReader = require('properties-reader');
var path = require('path');
var Transform = stream.Transform || require('readable-stream').Transform;
var N3 = require('n3');
var jsonld = require('jsonld');
var configuration = PropertiesReader(path.resolve(__dirname, '../', 'config', 'config.properties'));

function EnrichStream(options) {

  this.mapping = new R2rml(path.resolve(__dirname, '../', 'transformation', configuration.get('stream_mapping')));

  this.enrich = function(data) {

    var keys = Object.keys(data);

    var mmap = new Map();
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      mmap.set(key, data[key]);

    }


    return this.mapping.transform(mmap);
  };

  // allow use without new
  if (!(this instanceof EnrichStream)) {
    return new EnrichStream(options);
  }

  // init Transform
  Transform.call(this, options);
}
util.inherits(EnrichStream, Transform);


//var context = "https://schema.org/";

/*var enrich = function(change) {

  var result = {};
  var timestamp = new Date();
  var id = 'http://131.175.141.249/TripleWave/' + timestamp.getTime();
  var createdAt = timestamp;

  //result.original = change;

  result['http://www.w3.org/ns/prov#generatedAtTime'] = createdAt;
  result['@id'] = id;

  var graph = [];

  if (change.url.trim() !== '') {

    var diff = {
      '@id': change.url,
      '@type': 'https://schema.org/WebPage',
      'relatedLink': change.url,
      'category': change.namespace
    };

    if (change.flag.trim() !== '') {
      diff.category += ' ' + change.flag;
    }
    graph.push(diff);
  }



  var person;
  if (!change.robot) {
    person = {
      '@id': change.userUrl,
      "@type": 'https://schema.org/Person',
      name: change.user
    };
  } else {
    person = {
      '@id': change.userUrl,
      "@type": 'https://schema.org/Thing',
      name: change.user
    };

  }
  graph.push(person);

  var wikipedia = {
    '@type': 'https://schema.org/WebSite',
    '@id': change.wikipediaUrl,
    'relatedLink': change.wikipediaUrl,
    'name': change.wikipediaLong
  };

  graph.push(wikipedia);

  var userUrl = {
    '@id': change.userUrl,
    "@type": 'https://schema.org/WebPage',
    relatedLink: change.userUrl,
    'isPartOf': wikipedia['@id'],
    character: [{
      "@id": person['@id']
    }]
  };

  graph.push(userUrl);

  var page;
  var action;
  if (change.pageUrl.trim() !== '') {

    page = {
      '@id': change.pageUrl,
      '@type': 'https://schema.org/WebPage',
      'relatedLink': change.pageUrl,
      'name': change.page,
      'isPartOf': {
        "@id": wikipedia['@id']
      },
      'contributor': {
        "@id": person['@id']
      }
    };

    if (change.namespace.indexOf('talk') === -1) {
      page["http://xmlns.com/foaf/0.1/primaryTopic"] = {
        "@id": "http://live.dbpedia.org/resource/" + change.pageUrl.split('/')[change.pageUrl.split('/').length - 1]
      };
    }

    graph.push(page);

    if (change.newPage) {
      action = {
        '@id': 'http://131.175.141.249/TripleWave/action/' + timestamp.getTime(),
        '@type': 'https://schema.org/CreateAction',
        'result': {
          "@id": page['@id']
        },
        'agent': {
          "@id": person['@id']
        }
      };
    } else {
      action = {
        '@id': 'http://131.175.141.249/TripleWave/action/' + timestamp.getTime(),
        '@type': 'https://schema.org/UpdateAction',
        'object': {
          "@id": page['@id']
        },
        'agent': {
          "@id": person['@id']
        }
      };
    }
    graph.push(action);
  }

  var comment = {
    '@id': 'http://131.175.141.249/TripleWave/comment/' + timestamp.getTime(),
    '@type': 'https://schema.org/Comment',
    'text': change.comment

  };

  graph.push(comment);



  result["@graph"] = graph;
  result["@context"] = context;



  return result;
};*/



EnrichStream.prototype._transform = function(chunk, enc, cb) {

  var change = JSON.parse(chunk.toString());
  console.log(change)
  change = this.enrich(change);

  var writer = N3.Writer({
    format: 'N-Triples'
  });

  for (var i = change.length - 1; i >= 0; i--) {
    writer.addTriple(change[i]);
  }
  var _this = this;
  writer.end(function(error, result) {
    console.log(result);
    jsonld.fromRDF(result, function(err, json) {
      console.log(err);
      console.log(json);
      _this.push(json);
    });

  });
  cb();
};

exports = module.exports = EnrichStream;