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

source "$configuration"

 while [[ "$#" > 1 ]]; do case $1 in
    --mode) export mode="$2";;
	--sources) export sources="$2";;
    *) break;;
  esac; shift; shift
done

#. config/config.properties


#if [ -z "$mode" ]; then
#	echo "No running mode specified"
#	exit
#fi

echo "$mode"
echo "$sources"

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

DEBUG=* node app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"

