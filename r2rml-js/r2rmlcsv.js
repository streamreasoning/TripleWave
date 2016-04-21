
var R2rml=require('./r2rml.js');

var fs = require('fs');

var rr=new R2rml('lsd.r2rml')

var maps=readCsvLines("lsd_small.csv")
for (l=0;l<maps.length;l++){
  var triples=rr.transform(maps[l])
  triples.forEach(function(triple){
    console.log(triple)
  })
}


//Very inefficient cvs reads. Only to show how to fill data
function readCsvLines(file){
  var data=[]
  var lines = fs.readFileSync(file).toString().split('\n');
  var labels=lines[0].split(',');
  for (l=1;l<lines.length;l++){
    var line=lines[l].split(',');
    var mmap=new Map()
    for (i=0;i<labels.length;i++){
      mmap.set(labels[i],line[i])
    }
    data.push(mmap)
  }
  
  return data;
}


