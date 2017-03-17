PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>
PREFIX prov: <http://www.w3.org/ns/prov#> 
PREFIX obs: <http://knoesis.wright.edu/ssw/ont/sensor-observation.owl#>

WITH <http://example.org/sgraph>
INSERT{
  ?g prov:generatedAt ?ts ; <http://example.org/hasKey> ?key
}
WHERE {
  GRAPH <http://example/input>{
  ?key obs:samplingTime ?time . ?time <http://www.w3.org/2006/time#inXSDDateTime> ?ts
  BIND (iri(concat("[graphname]/",afn:localname(?key))) AS ?g)
 } 
}