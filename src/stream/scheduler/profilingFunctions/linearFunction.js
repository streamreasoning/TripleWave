const moment = require('moment');

// generates the new delay according to the current iteration number
var profilingFunction = function(data,previousTimestamp,min,iteration){
    let time = 10000-iteration;

    if(time<min){
        time=min;
    }
    
    return time;
}

module.exports=profilingFunction