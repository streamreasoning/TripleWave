const stream = require( 'stream' );

class TransformStream extends stream.Transform {
  constructor( options ) {
    super( options );

    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({
        port: configuration.get('ws_port'),
        path: configuration.get('ws_stream_location')
    });

    wss.on('connection', function(ws) {

        console.log('Webscoket openeded');
        /*server.fromSPARQL.on('data', function(data) {
          console.log(data.toString());
          try {

            ws.send(data.toString());
          } catch (e) {
            console.log(e);

          }
        });*/

        var pushData = function(data) {
            var _this = this;
        };


        try {

            server.fromSPARQL.on('data', pushData);
        } catch (e) {
            console.log(e);
        }

        ws.on('error', function(e) {
            console.log(e);
            ws.close();
        });



    });


}
  _transform( data, enc, cb ) {
    try {
      ws.send(data.toString());
      const error = null; // Fill in case of error
    } catch (e) {
        server.fromSPARQL.removeListener('data', pushData);
    }
    return cb( error );
  }
}

// NOT HERE
/*
    app.get(location + '/stream', function(req, res) {

        server.fromSPARQL.pipe(res);
        res.on('close', function() {
            server.fromSPARQL.unpipe(res);
        });

    });
  }
  */
