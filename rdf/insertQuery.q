PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>



WITH <http://example.org/sgraph>
INSERT{
  ?g <http://example.org/hasTime> ?ts ; <http://example.org/hasKey> ?subject
}
WHERE {
  GRAPH <http://example/input>{
  ?subject <http://knoesis.wright.edu/ssw/ont/sensor-observation.owl#samplingTime> ?time .
  ?time <http://www.w3.org/2006/time#inXSDDateTime> ?ts .
  BIND (iri(concat("http://example.org/graph/",afn:localname(?subject))) AS ?g)
 } 
}