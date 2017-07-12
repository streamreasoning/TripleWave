#!/bin/sh
#. triplewave.properties

echo "  _____    _      _   __      __            "
echo " |_   _| _(_)_ __| |__\ \    / /_ ___ _____ "
echo "   | || '_| | '_ \ / -_) \/\/ / _\` \ V / -_)"
echo "   |_||_| |_| .__/_\___|\_/\_/\__,_|\_/\___|"
echo "            |_| "
echo 
echo " http://streamreasoning.github.io/TripleWave"
echo

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

while [[ "$#" > 0 ]]; do case $1 in
  --mode) export mode="$2";;
	--sources) export sources="$2";;
	--debug) debug="true";;
	--log) log="true";;
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
    echo "the Fuseki pid is $!"
	   sleep 10
	fi
fi

echo "Starting up TripleWave ..."

if [ -z "${log}" ]; then
  if [ -z "${debug}" ]; then
    node app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"
  else
    echo "Starting in debug mode"
    node debug app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"
  fi
else
  if [ -z "${debug}" ]; then
    DEBUG=* node app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"
  else
    echo "Starting in debug mode"
    DEBUG=* node debug app.js --fuseki=$! --mode="$mode" --configuration="$configuration" --sources="$sources"
  fi
fi

