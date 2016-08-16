var stream = require('stream')
var moment = require('moment')

class RdfStreamScheduler extends stream.Transform {
  constructor( options ) {
    super( options );
    this.firstDataDate = null;
    this.firstRealDate = null;
  }

  _transform( data, enc, cb ) {
    if(this.firstRealDate == null){
      this.firstRealDate = moment();
      this.firstDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']);
      this.push(data);
      console.log("I am forwarding \n\t", data);
      return cb();
    } else {
        var currentDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']);
        var currentRealDate = moment();
        var diff = currentDataDate.diff(this.firstDataDate, 'milliseconds');
        var sleepTime = currentRealDate.diff(this.previousRealDate, 'milliseconds')+diff;
        console.log("I should sleep ", sleepTime);
        setTimeout(()=>{
          console.log("I slept ", sleepTime, " ["+moment()+"]");
          console.log("I am forwarding \n\t", data);
          this.push(data)
        }, sleepTime);
    }
//    const error = null;
//    return cb(error);

    const error = null; // Fill in case of error
    return cb( error );
  }
}

module.exports=RdfStreamScheduler
