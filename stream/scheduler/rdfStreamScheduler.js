var stream = require('stream')
var moment = require('moment')
const debug = require('debug')('RdfStreamScheduler')

class RdfStreamScheduler extends stream.Transform {
    constructor(options) {
        super(options);
        this.previousRealDate = null;
        this.previousDataDate = null;
        this.profilingFunction = options.profilingFunction
        this.err = 0.0;
        this.iteration = 0;
        this.min = 100;
    }

    _transform(data, enc, cb) {
        if (this.previousRealDate == null) {
            this.previousDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']);
            this.previousRealDate = moment();
            this.push(data);
            console.log("I am forwarding \n\t", data);
            return cb();
        } else {
            var currentDataDate = moment(data['http://www.w3.org/ns/prov#generatedAtTime']);
            let deltaDataDate;
            
            if(this.profilingFunction){

                deltaDataDate = this.profilingFunction(data,this.previousDataDate,this.min,this.iteration);
            }else{

                deltaDataDate = currentDataDate.diff(this.previousDataDate, 'milliseconds')
            }


            console.log('deltaDataDate: ', deltaDataDate, '(', currentDataDate.format('x'), '-', this.previousDataDate.format('x'), ')')
            if (deltaDataDate > 0) {
                if (this.iteration > 0)
                    var sleepTime = deltaDataDate - this.err / this.iteration;
                else
                    var sleepTime = deltaDataDate - this.err;
                console.log("I should sleep ", sleepTime);
                setTimeout(() => {
                    console.log("I slept ", sleepTime, " [", this.err, "]");
                    var currentRealDate = moment();
                    var deltaRealDate = currentRealDate.diff(this.previousRealDate, 'milliseconds')
                    console.log('deltaRealDate: ', deltaRealDate)
                    this.err = this.err + (deltaRealDate - deltaDataDate);
                    this.iteration = this.iteration + 1;
                    console.log('this.err: ', this.err, '(avg over ', this.iteration, ' elements: ', this.err / this.iteration, ')')
                        //          debug("I am forwarding \n\t", data);
                    this.previousRealDate = currentRealDate;
                    this.previousDataDate = currentDataDate;
                    this.push(data);
                    return cb();
                }, sleepTime);
            } else {
              this.push(data);
              return cb();
            }
        }
    }
}

module.exports = RdfStreamScheduler
