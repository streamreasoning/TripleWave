PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>
PREFIX prov: <http://www.w3.org/ns/prov#> 


WITH <http://example.org/sgraph>
INSERT{
  ?g prov:generatedAt ?ts ; <http://example.org/hasKey> ?subject
}
WHERE {
  GRAPH <http://example/input>{
  ?subject <http://knoesis.wright.edu/ssw/ont/sensor-observation.owl#samplingTime> ?time .
  ?time <http://www.w3.org/2006/time#inXSDDateTime> ?ts .
  BIND (iri(concat("[graphname]/",afn:localname(?subject))) AS ?g)
 } 
}