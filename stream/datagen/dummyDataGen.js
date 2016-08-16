var stream = require('stream')

class DummyDataGen extends stream.Readable {
  constructor( options ) {
    super( options );
    let i=0;
    setInterval(()=>{
      i++;
      console.log("At the ", i, " iteration, the time is ", Date.now());
      this.push({iteration: i, time: Date.now()});
    }, 1000);
  }

  _read( num ) {}
}

module.exports=DummyDataGen
