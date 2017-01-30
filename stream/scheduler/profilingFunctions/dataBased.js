const moment = require('moment');

// generate the delay using the timestamps of the data.
var profilingFunction = function(data,previousTimestamp,min,iteration){

    let time = moment(data['http://www.w3.org/ns/prov#generatedAtTime']).diff(previousTimestamp, 'milliseconds')
    
    return time;
}

module.exports=profilingFunction