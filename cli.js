#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2)),
    fs = require('fs'),
    ProgressBar = require('progress'),
    connectors = require('./lib/connectors');

var source = argv._[0],
    output = argv._[1];

if (!source || !output) {
    throw new Error('usage: openaddress-download FILE.json output');
}

var parsed = JSON.parse(fs.readFileSync(source, 'utf8'));

if (!parsed.data) {
    throw new Error('no data included in source');
}

var connector = connectors[parsed.type];

if (!connector) {
    throw new Error('no connector found');
}

connector(parsed, function(err, stream) {
    if (!argv.silent && parsed.type != "ESRI") showProgress(stream, parsed.type);
    if (parsed.type != "ESRI")
        stream.pipe(fs.createWriteStream(output));
    else {
        console.log("Progress Bar Disabled for ESRI Source - Please Be Patient");
        var addrCount = 0;
        
        stream.on('data', function(){
            process.stdout.write('Downloaded: ' + ++addrCount + " addresses\r");
        });

        stream.on ('close', function(){
            console.log("");
        });
        stream.pipe(fs.createWriteStream(output));

        
    }
});

function showProgress(stream, type) {
    var bar;
    if (type == 'http') {
        stream.on('response', function(res) {
            var len = parseInt(res.headers['content-length'], 10);
            bar = new ProgressBar('  downloading [:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: len
            });
        });
    } else if (type == 'ftp') {
        stream.on('size', function(len) {
            bar = new ProgressBar('  downloading [:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: len
            });
        });
    }
    stream.on('data', function(chunk) {
        if (bar) bar.tick(chunk.length);
    }).on('end', function() {
        if (bar) console.log('\n');
    });
}
