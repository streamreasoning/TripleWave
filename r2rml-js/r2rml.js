

//function() { 
  //this.trans = function(data) { return transform(data) };
//  this.r2rml = function(file) { return new R2rml(file)};
//}


TermMap = function(){
  this.template=null;
  this.constant=null;
  this.column=null;  
}

POMap = function(){
  this.predicate=null;
  this.oMap=new TermMap()
  this.parent=null;
}

TriplesMap = function(){
  this.sMap=new TermMap();
  this.poMaps=[];
}

$rdf = require('./node_modules/rdflib/dist/rdflib.js')
var fs = require('fs');

var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
var RML = $rdf.Namespace("http://semweb.mmlab.be/ns/rml#")
var RR  = $rdf.Namespace("http://www.w3.org/ns/r2rml#")

function R2rml(file){
  this.tripleMaps=[]  
  var store = $rdf.graph()
  read(this.tripleMaps)

  function read(tripleMaps){
    var body = fs.readFileSync(file).toString();
    var uri = 'https://example.org/resource.ttl'
    var mimeType = 'text/turtle'

    try {
      $rdf.parse(body, store, uri, mimeType)
    } catch (err) {
      console.log(err)
    }

    var tmaps = store.statementsMatching(undefined, RML('logicalSource'),undefined)  
    for (i=0;i<tmaps.length;i++){
      var tmap=tmaps[i].subject
      var tMap=readTriplesMap(tmap)
      console.log(tMap.poMaps.length)
      tripleMaps.push(tMap)
    }

  }




function transformTemp(temp,data){
  for (var k of data.keys()){
    temp=temp.replace("{"+k+"}",data.get(k))
  }
  return temp;  
}


function transformMap(map,data){
  if (map.template!=null){
    return transformTemp(map.template.value,data)
  }
  else if (map.column!=null){
    return data.get(column.value)
  }
  else {
    return map.constant
  }  
}

function transformPOMap(po,data){
  if (po.parent!=null){
    return transformMap(po.parent.sMap,data)
  }
  else {
    return transformMap(po.oMap,data)
  }
}


//function transform(data){
R2rml.prototype.transform=function(data){
  var triples=[]
  for (i=0;i<this.tripleMaps.length;i++){
    var tmap=this.tripleMaps[0]
    var subject=transformMap(tmap.sMap,data)
    tmap.poMaps.forEach(function(poMap){
      var predicate=poMap.predicate.uri
      var object=transformPOMap(poMap,data)
      triples.push({subject,predicate,object})
    })
  }
  return triples  
}




function readTriplesMap(tmap){  
  var tm=new TriplesMap()
  var smap=store.any(tmap,RR('subjectMap'))
  tm.sMap=readSubjectMap(smap)
  console.log('smap: '+smap)
  var pomaps = store.statementsMatching(tmap, RR('predicateObjectMap'))  
  pomaps.forEach(function(pomap){
    var ppp=readPOMap(pomap.object)
    
    tm.poMaps.push(ppp)
  })
  return tm;
}

function readSubjectMap(smap){
  var sm=new TermMap()
  sm.template=store.any(smap,RR('template'))  
  return sm;
}

function readPOMap(pomap){
  var pom=new POMap()
  pom.predicate=store.any(pomap,RR('predicate'))
  var omap=store.any(pomap,RR('objectMap'))
  var om=new TermMap()
  om.template=store.any(omap,RR('template'))
  om.constant=store.any(omap,RR('constant'))
  om.column=store.any(omap,RR('column'))

  var parent=store.any(omap,RR('parentTriplesMap'))
  if (parent!=null){
    pom.parent=readTriplesMap(parent)
  }
  pom.oMap=om
  return pom;
  
}
}

module.exports = R2rml;
