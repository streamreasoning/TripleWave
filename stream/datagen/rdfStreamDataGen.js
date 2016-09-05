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

        let idCreator = function (data) {

            let splittedId = data['@id'].split('/');

            let id = splittedId[splittedId.length - 1];

            let dataId = 'http://' + (options.configuration.get('externalAddress') || (options.configuration.get('hostname') + ':' + options.configuration.get('port'))) + '/' + id;

            return dataId;
        }


        let _this = this;
        file.pipe(JSONStream.parse('*'))
            .on('data', (data) => {
                debug(data);
                debug("-----------");
                data['@id'] = idCreator(data);
                _this.push(data);
            })
          //.pipe(this)
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
