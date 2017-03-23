var stream = require('stream')
var path = require('path')
var fs = require('fs')
var JSONStream = require('JSONStream')
const debug = require('debug')('tw:Bottleneck')
var uuid = require('node-uuid');
var moment = require('moment');

class Bottleneck extends stream.PassThrough {


    constructor(options) {
        super(options);

      
    }

    _transform(data, enc, cb) {
        this.push(data);
        debug(data);
        return cb();
    }

}

module.exports = Bottleneck
