PREFIX : <http://www.streamreasoning.org/ontologies/rsplab/citybench.owl#>
PREFIX ct: <http://www.insight-centre.org/citytraffic#>
PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>
 
SELECT ?o ?time
WHERE { 
?o a ssn:Observation ; :eventTime ?time }
ORDER BY DESC(?time)