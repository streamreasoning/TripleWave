var stream = require('stream')

class ProfilerScheduler extends stream.Transform {
  constructor( options ) {
    super( options );

    this.step = options.step;
    this.min = options.min
    this.profilingFunction = options.profilingFunction;
    this.iteration = 0;

  }

  _transform( data, enc, cb ) {
      if(this.iteration===0){
          console.log('First iteration')
          this.push(data);
          this.iteration = this.iteration+1
          return cb();
      }else{
          console.log(this.iteration)
          let time = this.profilingFunction(this.iteration); 
          if(time<0){
              time=min;
          }

          setTimeout(()=>{
                this.push(data);
                this.iteration++;
                console.log(time);
                console.log("I am forwarding\n\n");
                return cb();
            }, time);
      }
  }
}

module.exports=ProfilerScheduler
