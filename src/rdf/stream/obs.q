PREFIX : <http://www.rsp-lab.org/triplewave/citybench/>
PREFIX ct: <http://www.insight-centre.org/citytraffic#>
PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>
 
SELECT ?o ?time
WHERE { 
?o a ssn:Observation ; :eventTime ?time }
ORDER BY DESC(?time)