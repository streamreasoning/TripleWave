var stream = require('stream')
var path = require('path')
var fs = require('fs')
var JSONStream = require('JSONStream')
const debug = require('debug')('RdfStreamDataGen')
var uuid = require('node-uuid');
var moment = require('moment');

class FakeDataGen extends stream.PassThrough {


    constructor(options) {
        super(options);
        setInterval((function() {
                    var element = {
                    "@context": "http://schema.org/",
                    "@id": "http://streamreasoning.org/triplewave/"+options.configuration.get("stream_name")+"-"+uuid.v4(),
                    "@type": "Intangible",

                    "http://www.w3.org/ns/prov#generatedAtTime": moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ")  
                    }
                    
                    this.push(element);
                }).bind(this), 1000);
    }
}

module.exports = FakeDataGen

