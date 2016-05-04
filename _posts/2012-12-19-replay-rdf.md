---
category: Use modes
path: 
title: 'Run Triplewave to stream your own RDF data'
type: 'Replay'

layout: nil
---

TripleWave can convert an existing dataset (containing some temporal information) in an RDF stream and can stream it out. In the following, we explain how to configure TripleWave in order to work in this setting.

### Set the execution mode and the input file

In order to stream your own RDF file, you should first set one of the two execution modes in the `mode` parameter of the configuration file.

* Replay
* Endless

Moreover, you should set the file location of the RDF file to be converted. It can be done by filling the field `rdf_file` in the config file, e.g.,

    rdf_file=../rdf/data.ttl

### Create the stream item structure

The first conversion step consists in specifying how to create the RDF stream items, i.e., a set of pairs *(g,t)* where *g* denotes an RDF graph and *t* a time stamp.

Being the file imported an RDF graph, i.e., a set of triples, it is necessary to specify the criteria to (1) group the data in RDF graphs and (2) associate a time instant to each of them. It is done through the following parametric SPARQL query:

    PREFIX sr: <http://streamreasoning.org/>
    WITH sr:sgraph
    INSERT{
      ?g prov:generatedAt ?ts ; sr:hasKey ?key
    }
    WHERE {
      GRAPH sr:input{
      [rdf_stream_item_pattern]
      BIND (iri(concat("http://streamreasoning.org/igraph/",afn:localname(?key))) AS ?g)
      } 
    }

The above query is dependent on the input data and this fact is captured by the [rdf_stream_item_pattern] parameter. It is necessary to set through the `rdf_stream_item_pattern` parameter in the config file the value with the following constraints:

* it is a Basic Graph pattern;
* it uses two special variables *?key* and *?ts* to set respectively the resource used to partition the data and the relative timestamp;
* there is a 1:1 relation between *?key* and *?ts*, i.e., for each value of *?key* there is exactly one *?ts* value (and vice versa). 

TripleWave assumes that the three constraints are verified, otherwise it may not behave properly. With reference to the supplied example file data.ttl, the stream_item_pattern parameter can be set as (**in one line**):


    rdf_stream_item_pattern = 
      ?key <http://knoesis.wright.edu/ssw/ont/sensor-observation.owl#samplingTime> ?time . 
      ?time <http://www.w3.org/2006/time#inXSDDateTime> ?ts

Consequently, the following query is executed over the input data

    PREFIX sr: <http://streamreasoning.org/>
    WITH sr:sgraph
    INSERT{
      ?g prov:generatedAt ?ts ; sr:hasKey ?key
    }
    WHERE {
      GRAPH sr:input{
       ?key <http://knoesis.wright.edu/ssw/ont/sensor-observation.owl#samplingTime> ?time . 
       ?time <http://www.w3.org/2006/time#inXSDDateTime> ?ts
       BIND (iri(concat("http://streamreasoning.org/igraph/",afn:localname(?key)))  AS ?g)
      } 
    }

#### Fill the stream items
The previous step creates the stream item structure, with element names and relative time instants.
To complete the conversion, it is necessary to fill the stream elements with their content.
This operation is done with a set of SPARQL queries in the form:

    PREFIX sr: <http://streamreasoning.org/>
    WITH [g]
    INSERT{
      [stream_item_content_pattern]
    }
    WHERE {
		GRAPH sr:input{
			[stream_item_content_pattern]
		}
    }

[g] denotes a stream element identifier, while [stream_item_content_pattern] indicates the Basic Graph Pattern that extracts the window content. 

[g] is automatically set by the TripleWave, while [stream_item_content_pattern] is loaded by the config file. That means, you should set the [stream_item_content_pattern] value through the 
`stream_item_content_pattern` parameter.