var stream = require('stream')
var path = require('path')
var fs = require('fs')
var JSONStream = require('JSONStream')

var configuration = require('../../configuration')

class RdfStreamDataGen extends stream.PassThrough {
    constructor(options) {
        super(options);
        console.log('Reading source: ', configuration.get('sources'));
        var filePath = path.join(__dirname, '../../', configuration.get('rdfstream_file'))
        console.log('File path', filePath);
        var file = fs.createReadStream(filePath)
        file.pipe(JSONStream.parse('*'))
          .pipe(this)
          .on('data', (data) => {
            //console.log(data);
            console.log("-----------");
          })
/*          .pipe((graph) => {
                this.push(graph)
                return oboe.drop;
            })
            .on('fail', (err) => {
                console.error('OBOE error', err);
            });
*/    }
}

module.exports = RdfStreamDataGen
