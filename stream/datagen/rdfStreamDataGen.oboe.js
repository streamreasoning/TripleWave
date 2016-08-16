var stream = require('stream')
var path = require('path')
var fs = require('fs')
var oboe = require('oboe')

var configuration = require('../../configuration')

class RdfStreamDataGen extends stream.Readable {
    constructor(options) {
        super(options);
        console.log('Reading source: ', configuration.get('sources'));
        var filePath = path.join(__dirname, '../../', configuration.get('rdfstream_file'))
        console.log('File path', filePath);
        var file = fs.createReadStream(filePath)
        oboe(file)
            .node('![*]', (graph) => {
                this.push(graph)
                return oboe.drop;
            })
            .on('fail', (err) => {
                console.error('OBOE error', err);
            });
    }

    _read(num) {}
}

module.exports = RdfStreamDataGen
