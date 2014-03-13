var request = require('request');
var Ftp = require('ftp');
var _ = require('underscore');
var url = require('url');

var connectors = module.exports = {};

connectors.http = function(address, callback) {
    callback(null, request.get({
        url: address.data,
        timeout: 7000
    }));
};

connectors.ftp = function(address, callback) {
    var opt = url.parse(address.data),
        ftp = new Ftp();

    opt.user = (opt.auth || ':').split(':')[0];
    opt.password = (opt.auth || ':').split(':')[1];
    opt.connTimeout = 5000;

    ftp.on('ready', function() {
        ftp.size(opt.path, function(err, sz) {
            size = sz;
            ftp.get(opt.path, function(err, stream) {
                stream.once('close', function() { ftp.end(); });
                callback(err, stream);
                stream.emit('size', size);
            });
        });
    });

    ftp.connect(opt);
};

connectors.esri = function(address, targetStream) {
    // Downloads for esri not implemented yet.
    return connectors.http(address, null);
};

connectors.byAddress = function(address) {
    var opt = url.parse(address);
    if (opt.protocol == 'ftp:') {
        return 'ftp';
    } else if (opt.protocol == 'http:' || opt.protocol == 'https:') {
        if (opt.path.search(/\/MapServer\/\d+/) !== -1) {
            return 'http'; // esri in future
        } else if (opt.path.search(/\/FeatureServer\/\d+$/) !== -1) {
            return 'http'; // esri in future
        } else {
            return 'http';
        }
    }
    return null;
};
