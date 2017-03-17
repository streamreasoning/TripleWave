PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>

WITH <[g]>
INSERT{
?key ?p ?o
}
WHERE {
  GRAPH <http://example/input>{
  ?key ?p ?o
 } 
} 