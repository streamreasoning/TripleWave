var PropertiesReader = require('properties-reader');
var path = require('path');

var configuration = PropertiesReader(path.resolve(__dirname, 'config', 'config.properties'));
configuration.set('externaladdress', configuration.get('hostname') + configuration.get('path'))

module.exports = configuration;
