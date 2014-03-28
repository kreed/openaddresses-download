var request = require('request'),
    Ftp = require('ftp'),
    url = require('url'),
    esriDump = require('esri-dump'),
    geojsonStream = require('geojson-stream');

var connectors = module.exports = {};

connectors.ESRI = function(address, callback) {

    try {
        var stream = esriDump(address.data).pipe(geojsonStream.stringify());
        callback(null, stream);
    } catch (e) {
        callback(e);
    }
};

connectors.http = function(address, callback) {
    try {
        callback(null, request.get({
            url: address.data,
            timeout: 7000
        }));
    } catch(e) {
        callback(e);
    }
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
                if (err) return callback(err);
                stream.once('close', function() { ftp.end(); });
                callback(err, stream);
                stream.emit('size', size);
            });
        });
    });

    ftp.on('error', function(e) {
        callback(e);
    });

    ftp.connect(opt);
};
