---
title: 'Installation'

layout: nil
---


### Requirements

* nodejs (tested on version 4.4.0 and 5)
* java 8 (for fuseki, theoretically you can ignore this if you plan to use only the transform mode)

In order to install TripleWave just clone the repository

    git clone https://github.com/streamreasoning/TripleWave.git

Then simply run

    npm install

for installing the node dependencies.

### Possible bugs

* While installing the dependency `node-icu-charset-detector` you could see ../node-icu-charset-detector.cpp:5:10: fatal error: 'unicode/ucsdet.h' file not found (tested on OSX 10.10), see [here](https://github.com/mooz/node-icu-charset-detector/issues/5)
* While installing the dependency `node-iconv` you could see ../node_modules/nan/nan.h:601:20: error: no type named 'GCPrologueCallback' in 'v8::Isolate'(tested on 10.10), please ignore.. 

