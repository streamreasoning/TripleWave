PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>
PREFIX prov: <http://www.w3.org/ns/prov#> 


WITH <http://example.org/sgraph>
INSERT{
  ?g prov:generatedAt ?ts ; <http://example.org/hasKey> ?key
}
WHERE {
  GRAPH <http://example/input>{
  [pattern]
  BIND (iri(concat("[graphname]/",afn:localname(?key))) AS ?g)
 } 
}