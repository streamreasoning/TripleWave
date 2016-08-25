#!/bin/sh
#. triplewave.properties
 
. config/config.properties

if [ "$mode" != "transform" ]; then
	if [ "$sources" != "rdfstream" ]; then
	   cd fuseki
	#   if [ "$file" = "" ]; then
	      java -jar jena-fuseki-server-2.3.1.jar --update --mem /ds &
	#   else
	#      java -jar jena-fuseki-server-2.3.1.jar --mem --update /ds &
	   cd ..
	   sleep 10
	fi
else
   echo "don't start fuseki"
fi


echo "the fuseki pid is $!"

if [ "$1" == 'debug' ]; then 
	echo "Starting TripleWave in debug mode"
	node debug app.js
else
	DEBUG=* node app.js -fuseki=$!
fi
