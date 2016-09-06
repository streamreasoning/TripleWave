#!/bin/sh
#. triplewave.properties
 

while [[ "$#" > 1 ]]; do case $1 in
    --configuration) configuration="$2";;
    *) break;;
  esac; shift; shift
done

if [ -z "$configuration" ]; then
	configuration="config/config.properties"
fi

echo "Looking for the configuration file ${configuration}"

echo "Reading the configuration file"
while IFS='=' read -r key value; do
   case $key in
       ''|\#*) continue ;;         # skip blank lines and lines starting with #
   esac
   # stuff with var1, etc.
   eval "${key}='${value}'"
done < "${configuration}"


 while [[ "$#" > 1 ]]; do case $1 in
    --mode) export mode="$2";;
	--sources) export sources="$2";;
	--debug) export debug="$2";;
    *) break;;
  esac; shift; shift
done

echo "Starting Up..."
if [ "$mode" != "transform" ]; then
	if [ "$sources" != "rdfstream" ]; then
     
     echo "Starting up Fuseki..."
	   cd fuseki
	   java -jar jena-fuseki-server-2.3.1.jar --update --mem /ds &
	   cd ..
    echo "the fuseki pid is $!"
	   sleep 10
	fi
fi


echo "Starting up TripleWave ..."
if [ -z "$debug" ]; then
  echo "Starting in debug mode"
  DEBUG=* node debug app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"
else
  node app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"
fi

