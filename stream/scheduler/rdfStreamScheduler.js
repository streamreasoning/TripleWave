var stream = require('stream')
var moment = require('moment')
const debug = require('debug')('RdfStreamScheduler')

class RdfStreamScheduler extends stream.Transform {
  constructor( options ) {
    super( options );
    this.previousRealDate = null;
    this.previousDataDate = null;
    this.err = 0.0;
    this.iteration = 0;
  }

  _transform( data, enc, cb ) {
    if(this.previousRealDate == null){
      this.previousDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']);
      this.previousRealDate = moment();
      this.push(data);
      debug("I am forwarding \n\t", data);
      return cb();
    } else {
        var currentDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']);
        var deltaDataDate = currentDataDate.diff(this.previousDataDate, 'milliseconds')
        debug('deltaDataDate: ', deltaDataDate)
        if(this.iterataion > 0)
          var sleepTime = deltaDataDate - this.err/this.iteration;
        var sleepTime = deltaDataDate - this.err;
        debug("I should sleep ", sleepTime);
        setTimeout(()=>{
          debug("I slept ", sleepTime, " [", this.err, "]");
          var currentRealDate = moment();
          var deltaRealDate = currentRealDate.diff(this.previousRealDate, 'milliseconds')
          debug('deltaRealDate: ', deltaRealDate)
          this.err = this.err + (deltaRealDate - deltaDataDate);
          this.iteration = this.iteration+1;
          debug('this.err: ', this.err, '(avg over ', this.iteration, ' elements: ', this.err/this.iteration, ')')
          debug("I am forwarding \n\t", data);
          this.push(data)
          this.previousRealDate = currentRealDate;
          this.previousDataDate = currentDataDate;
          return cb();
        },sleepTime);
    }
//    const error = null;
//    return cb(error);

//    const error = null; // Fill in case of error
//    return cb( error );
  }
}

module.exports=RdfStreamScheduler
