var stream = require('stream')
var path = require('path')
var fs = require('fs')
var JSONStream = require('JSONStream')
const debug = require('debug')('RdfStreamDataGen')

class RdfStreamDataGen extends stream.PassThrough {


    constructor(options) {
        super(options);

        debug('Reading source: ', options.configuration.get('sources'));
        var filePath = path.join(__dirname, '../../', options.configuration.get('rdfstream_file'))
        debug('File path', filePath);
        var file = fs.createReadStream(filePath)


        let _this = this;
        file.pipe(JSONStream.parse('*'))
            .pipe(this)
            .on('data', (data) => {
                debug(data);
                debug("-----------");
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
