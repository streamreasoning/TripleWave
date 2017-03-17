var stream = require('stream')

class DummyScheduler extends stream.Transform {
  constructor( options ) {
    super( options );
  }

  _transform( data, enc, cb ) {
      setTimeout(()=>{
        this.push(data);
        console.log("I am forwarding \n\t", data);
        const error = null;
        return cb(error);
      }, 500);
  }
}

module.exports=DummyScheduler
