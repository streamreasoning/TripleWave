var stream = require('stream');
var util = require('util');
var wikichanges = require("wikichanges");
var debug = require('debug')('Wikistream IRC');

var Transform = stream.Transform || require('readable-stream').Transform;

// Stream wikipeida changes using IIRC
// PROBLEM: non standard port
function WikiStream(options) {
  // allow use without new
  if (!(this instanceof WikiStream)) {
    return new WikiStream(options);
  }

  debug('Creating the stream');

  this.close = false;
  this.w = new wikichanges.WikiChanges({
    ircNickname: "jsonLDBot",
    wikipedias: ["#en.wikipedia"]
  });
  _this = this;

  this.w.listen(function(c) {
    console.log(c);
    if (!_this.close) {
      _this.push(c);
    } else {
      _this.push(null);
    }
  });


  // init Transform
  Transform.call(this, options);


}
util.inherits(WikiStream, Transform);

WikiStream.prototype._read = function(enc, cb) {};

WikiStream.prototype.closeStream = function() {
  this.close = true;
};
exports = module.exports = WikiStream;