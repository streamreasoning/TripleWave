#!/bin/sh
#. triplewave.properties
 
. config/config.properties

if [ "$mode" = "replay" ]; then
   cd fuseki
#   if [ "$file" = "" ]; then
      java -jar jena-fuseki-server-2.3.1.jar --file=../$rdf_file --update /ds &
#   else
#      java -jar jena-fuseki-server-2.3.1.jar --mem --update /ds &
   cd ..
else
   echo "don't start fuseki"
fi

echo "the fuseki pid is $!"
node app.js
