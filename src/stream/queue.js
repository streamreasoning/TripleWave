var stream = require('stream')
var moment = require('moment')
const debug = require('debug')('Queue')

class Queue extends stream.Transform {
    constructor(options) {
        super(options);

        this.configuration = options.configuration
        this.queue = []
        this.queueSize = options.size || 10;
    }


    _transform(data, enc, cb) {

        this.queue.push(data);

        if (this.queue.length === this.queueSize) {
            let temp = this.queue.slice(0, this.queue.length - 1);
            this.queue = [];
            for (var index = 0; index < temp.length; index++) {
                var element = temp[index];
                this.push(element);
                debug('Pushing %j ', element);
            }
        } else {
            debug("Enqueuing data")
        }

        return cb();
    }

    _flush(cb) {
        debug('Input stream terminated, pushing the remaining data')
        let queue = this.queue;
        for (var index = 0; index < queue.length; index++) {
            var element = queue[index];
            this.push(element);
            debug('Pushing %j ', element);
        }
    }


}

module.exports = Queue