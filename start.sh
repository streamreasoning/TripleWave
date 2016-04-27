#!/bin/sh
#. triplewave.properties
 
. config/config.properties

if [ "$mode" = "replay" ]; then
   cd fuseki
#   if [ "$file" = "" ]; then
      java -jar jena-fuseki-server-2.3.1.jar --update --mem /ds &
#   else
#      java -jar jena-fuseki-server-2.3.1.jar --mem --update /ds &
   cd ..
   sleep 7
else
   echo "don't start fuseki"
fi


echo "the fuseki pid is $!"
node app.js
