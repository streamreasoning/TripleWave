#!!!!!! [g] parameter will be programmatically with the right name -> DON'T CHANGE IT !!!!!! 
#!!!!!! http://example/input is the graph filled with static data by default -> DON'T CHANGE IT !!!!!! 
# !!!!!! please modify only the INSERT and WHERE (the GRAPH clause) clause based on the format of your static data

PREFIX afn: <http://jena.hpl.hp.com/ARQ/function#>
WITH <[g]>
INSERT{
?key ?p ?o . 
?o ?p1 ?o1
}
WHERE {
  GRAPH <http://example/input>{
    ?key ?p ?o
    OPTIONAL {?o ?p1 ?o1}
 } 
} 