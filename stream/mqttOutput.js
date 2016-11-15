var stream = require('stream');
var util = require('util');
var _ = require('underscore');
var PropertiesReader = require('properties-reader');
var path = require('path');
var Writable = stream.Writable;
var mqtt = require('mqtt')
const debug = require('debug')('MQTTOut')

function MQTTOut(options) {

  var configuration = options.configuration;
  this.mqttClient = mqtt.connect('mqtt://localhost:1883');
  this.mqttClient.on('connect', () => {
    this.mqttClient.subscribe('twave');
  });

  // allow use without new
  if (!(this instanceof MQTTOut)) {
    return new MQTTOut(options);
  }

  // init Writable
  Writable.call(this, options);
}
util.inherits(MQTTOut, Writable);


MQTTOut.prototype._write = function(chunk, encoding, done) {
  this.mqttClient.publish('twave', JSON.stringify(chunk));
  done();
};

exports = module.exports = MQTTOut;
