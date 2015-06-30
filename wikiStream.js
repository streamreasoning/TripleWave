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

  this.w = new wikichanges.WikiChanges({
    ircNickname: "jsonLDBot",
    wikipedias: ["#en.wikipedia"]
  });
  _this = this;

  this.w.listen(function(c) {

    _this.push(JSON.stringify(c));
  });

  // init Transform
  Transform.call(this, options);
}
util.inherits(WikiStream, Transform);

WikiStream.prototype._read = function(enc, cb) {

  console.log('Reading stream');
};

exports = module.exports = WikiStream;