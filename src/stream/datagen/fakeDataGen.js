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

        var name = options.configuration.get("stream_name");
        var element = fs.readFileSync(path.resolve(__dirname,'../../', 'rdf', options.configuration.get('payload'))).toString();
        element = JSON.parse(element)
        setInterval((function() {
                    element['@id'] = "http://streamreasoning.org/triplewave/"+name+"-"+uuid.v4();
                    element['http://www.w3.org/ns/prov#generatedAtTime'] =  moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
                    this.push(element);
        }).bind(this), 1000);
    }
}

module.exports = FakeDataGen

