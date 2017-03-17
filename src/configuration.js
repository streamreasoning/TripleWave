var PropertiesReader = require('properties-reader');
var path = require('path');

//configuration.set('externaladdress', configuration.get('hostname') + configuration.get('path'))

module.exports = function configuration(location){
    var configuration;
    if(!location){
        configuration = PropertiesReader(path.resolve(__dirname, 'config', 'config.properties'));
    }else{
        configuration = PropertiesReader(path.resolve(location));
    }

    return configuration;
    
};
