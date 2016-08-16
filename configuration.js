var PropertiesReader = require('properties-reader');
var path = require('path');

var configuration = PropertiesReader(path.resolve(__dirname, 'config', 'config.properties'));

module.exports = configuration;
