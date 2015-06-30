var stream = require('stream');
var util = require('util');
var wikichanges = require("wikichanges");

var Transform = stream.Transform || require('readable-stream').Transform;

function WikiStream(options) {
  // allow use without new
  if (!(this instanceof WikiStream)) {
    return new WikiStream(options);
  }

  console.log('Creating the stream');
  this.close = false;
  this.w = new wikichanges.WikiChanges({
    ircNickname: "jsonLDBot",
    wikipedias: ["#en.wikipedia"]
  });
  _this = this;

  this.w.listen(function(c) {

    if (!_this.close) {

      _this.push(JSON.stringify(c));
    } else {
      _this.push(null);
    }
  });


  // init Transform
  Transform.call(this, options);


}
util.inherits(WikiStream, Transform);

WikiStream.prototype._read = function(enc, cb) {

  console.log('Reading stream');
};

WikiStream.prototype.closeStream = function() {
  this.close = true;
};
exports = module.exports = WikiStream;