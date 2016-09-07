---
category: ''
path: ''
title: 'Consuming the TripleWave data'
type: 'RSP-Services'

layout: nil
---


### RSP service interfaces

The user can consume a triple wave stream by exploiting RSP services interfaces. The RSP services offers simple HTTP call to interact with an RSP and register stream, register query and consume results.
The user can interact with RSP (in this we exemplify the operation flow using the C-SPARQL engine) and consume the stream as follow:

* Identifies the stream by its IRI of the stream (which is the URL of the sGraph)
* Register the new stream in the C-SPARQL engine using an HTTP PUT Call (`<serveraddress>/streams`) to the RSP Sevices interfaces with the parameter `streamIRI` in the body (it represents the unique ID of the stream in the engine).
* RSP Services looks at the sGraph URL, parses it and gets the information regarding the TBox and WebSocket
* The TBox (if available) is associated to the stream.
* A WebSocket connection is established and the data flows into C-SPARQL
* Register a new query for the registered stream using an HTTP PUT call `<serveraddress>/streams/<queryName>` with the query in the body as raw string
* The TBox is loaded into the reasoner (if available) associated to the query
* The query is performed on the flowing data.

[Here](http://streamreasoning.org/TripleWave/Running_Examples.zip) is available a compressed file containing running examples that exploit online RDF streams created with TripleWave and the C-SPARQL Engine (via RSP Services).

The source code of the RSP Services can be found on [github](http://github.com/streamreasoning/rsp-services-client-example/tree/triplewave).

The source code of the running examples client can be found on [github](http://github.com/streamreasoning/rsp-services-csparql). 
