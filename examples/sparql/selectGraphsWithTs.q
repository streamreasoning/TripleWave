PREFIX prov: <http://www.w3.org/ns/prov#> 

SELECT ?graph ?ts 
FROM <http://example.org/sgraph> 
WHERE{?graph prov:generatedAt  ?ts} 
ORDER BY ?ts 