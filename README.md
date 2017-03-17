``` 
    docker build -t tw-running 
```

Passing files:
    - config.properties specifying how tw should be setup [expected]

CLI parameters
    -l/--log enable logging
    -d/--debug enable debug
    -c/--configuration enable passing custom configuration from CLI


``` 
   
   E.G. docker run -it --link fuseki:fuseki --name twruning tw/running <params>

   E.G. docker run -it --link fuseki:fuseki --name twruning tw/running --debug --log
```

NOTABLY, Triple wave has to be connected to a running Fuseki endpoint with the option --link fuseki-container-name:internal-name

