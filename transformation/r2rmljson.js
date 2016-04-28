var R2rml = require('../r2rml-js/r2rml.js');

var fs = require('fs');

var rr = new R2rml('wiki.r2rml')

var maps = readJson("wiki_small.json")
for (l = 0; l < maps.length; l++) {
  var triples = rr.transform(maps[l])
  triples.forEach(function(triple) {
    console.log(triple)
  })
}


//Very inefficient cvs reads. Only to show how to fill data
function readJson(file) {
  var data = []
  var json = JSON.parse(fs.readFileSync(file).toString());
  json.forEach(function(obj) {
    console.log("kkkk " + obj)

    var mmap = new Map()
    Object.keys(obj).forEach(function(key) {
      mmap.set(key, obj[key])
    });
    data.push(mmap)
  });

  return data;
}