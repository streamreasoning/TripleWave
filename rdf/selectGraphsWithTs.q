SELECT ?graph ?ts 
FROM <http://example.org/sgraph> 
WHERE{?graph <http://example.org/hasTime>  ?ts} 
ORDER BY ?ts 