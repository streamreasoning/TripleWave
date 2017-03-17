var stream = require('stream')
var moment = require('moment')
const debug = require('debug')('CurrentTimestampReplacer')

class CurrentTimestampReplacer extends stream.Transform {
  constructor( options ){
    super( options );
  }

  _transform( data, enc, cb ){
    data['http://www.w3.org/ns/prov#generatedAtTime'] = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
    debug("I am forwarding \n\t", data);
    this.push(data);
    return cb()
  }
}

module.exports=CurrentTimestampReplacer
