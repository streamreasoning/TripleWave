var stream = require('stream')
var moment = require('moment')
const debug = require('debug')('tw:StreamScaler')

class StreamScaler extends stream.Transform {
    constructor(options) {
        super(options);
        this.previousDataDate = null;
        this.scale = options.scale | 1;
        this.iteration = 0;
    }

    _transform(data, enc, cb) {
        if (this.previousDataDate == null) {
            this.previousDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']['@value']);
            this.push(data);
            debug("I am forwarding \n\t", data);
            return cb();
        } else {
            var currentDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']['@value']);
            var deltaDataDate = currentDataDate.diff(this.previousDataDate, 'milliseconds')
            debug('deltaDataDate: ', deltaDataDate, '(', currentDataDate.format('x'), '-', this.previousDataDate.format('x'), ')')
            if (deltaDataDate > 0) {
                
                var sleepTime = deltaDataDate/this.scale;

                debug("I should sleep ", sleepTime);
                setTimeout(() => {
                    debug("I slept ", sleepTime);
                    this.push(data);
                    this.previousDataDate = currentDataDate;
                    return cb();
                }, sleepTime);
            } else {
              this.push(data);
              return cb();
            }
        }
    }
}

module.exports = StreamScaler
