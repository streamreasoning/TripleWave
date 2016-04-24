PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>

WITH <[g]>
INSERT{
<[k]> ?p ?o
}
WHERE {
  GRAPH <http://example/input>{
<[k]> ?p ?o
 } 
} 