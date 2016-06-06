# !!!!!! http://example.org/sgraph is the deafult name of the sgraph -> DON'T CHANGE IT !!!!!! 
# !!!!!! the BIND (iri(concat("[graphname]/",afn:localname(?key))) AS ?g) is needed to create a compatible IRI for the timestamped graph references  -> DON'T CHANGE IT !!!!!! 
# !!!!!! the INSERT clause is standard  -> DON'T CHANGE IT !!!!!! 
# !!!!!! please modify only the WHERE clause based on the format of your static data

PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>
PREFIX prov: <http://www.w3.org/ns/prov#> 

WITH <http://example.org/sgraph>
INSERT{
  ?g prov:generatedAt ?ts ; <http://example.org/hasKey> ?key
}
WHERE {
  GRAPH <http://example/input>{
    ?key <http://knoesis.wright.edu/ssw/ont/sensor-observation.owl#samplingTime> ?time . 
    ?time <http://www.w3.org/2006/time#inXSDDateTime> ?ts .    
    BIND (iri(concat("[graphname]/",afn:localname(?key))) AS ?g)
 } 
}