#!/bin/sh
. triplewave.properties
 
if [ "$source" = "triples" ]; then
   cd fuseki
#   if [ "$file" = "" ]; then
      java -jar jena-fuseki-server-2.3.1.jar --file=../$file --update /ds &
#   else
#      java -jar jena-fuseki-server-2.3.1.jar --mem --update /ds &
   cd ..
else
   echo "don't start fuseki"
fi

echo "the fuseki pid is $!"
node app.js
