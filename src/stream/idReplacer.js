var stream = require('stream')
var moment = require('moment')
const debug = require('debug')('tw:IdReplacer')

class IdReplacer extends stream.Transform {
    constructor(options) {
        super(options);

        this.configuration = options.configuration
    }


    _transform(data, enc, cb) {

        let idCreator = function(data,configuration) {

            let splittedId = data['@id'].split('/');

            let id = splittedId[splittedId.length - 1];

            let dataId = 'http://' + (configuration.get('externalAddress') || (configuration.get('hostname') + ':' + configuration.get('port'))) + '/' + id;

            debug("I am replacing the ID\n")
            return dataId;
        }

        data['@id'] = idCreator(data,this.configuration);
        data['@graph']['@id'] = data['@id'];

        this.push(data);
        return cb()
    }
}

module.exports = IdReplacer
