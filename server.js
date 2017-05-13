var os = require('os');
var fs = require('fs');
var path = require('path');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');

var config = {
  prefix: "/", //REST API route prefix, e.g. "/" for root or "/api/v1" etc.
  verbose: process.env.NODE_VERBOSE == "true" || process.env.NODE_VERBOSE == "1"
};

//Command line arguments
var args = process.argv.slice(2);
for (var i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--help":
      help();
      process.exit(0);
      break;
  
    case "-p":
    case "--port":
      config.port = parseInt(args[++i]);
      if (!(config.port > 0)) {
        console.error("Expected a numeric HTTP port number!");
        process.exit(3);
      }
      break;
      
    case "--prefix":
      config.prefix = args[++i];
      break;
      
    case "--vboxmanage":
      config.vboxmanage = args[++i];
      break;
      
    case "--verbose":
      config.verbose = true;
      break;
      
    case "--version":
      console.log(require('./package.json').version);
      process.exit(0);
      break;
      
    default:
      console.error("Unknown command line argument: " + args[i]);
      process.exit(1);
      break;
  }
}

//Prints help message
function help() {
  console.log("Usage:");
  console.log("  vboxmanage-rest-api [options]");
  console.log("");
  console.log("Options:");
  console.log("  --help                 Print this message");
  console.log("  --port, -p [num]       HTTP port number, default: 8269");
  console.log("  --prefix [path]        URL prefix: '/' for root or '/api/v1' etc.");
  console.log("  --vboxmanage [path]    Path to vboxmanage executable");
  console.log("  --verbose              Enable detailed logging");
  console.log("  --version              Print version number");
  console.log("");
  console.log("Examples:");
  console.log("  vboxmanage-rest-api");
  console.log("  vboxmanage-rest-api --port 80");
  console.log("  vboxmanage-rest-api --prefix /api/v1 --verbose");
}

var app = express();
app.startup = new Date();
app.uptime = function() {
  return Math.ceil(new Date().getTime() - app.startup.getTime());
};

app.use(logger('dev'));
app.use(bodyParser.json());

//API status and version
app.get(config.prefix || "/", function(req, res, next) {
  var pkg = require('./package.json');
  res.json({ name: pkg.name, version: pkg.version, uptime: app.uptime() });
});

//Register the VBoxManage REST API with the prefix
var vboxservice = require('./lib/webservice.js');
app.use(config.prefix || "/", vboxservice({
  vboxmanage: config.vboxmanage,
  verbose: config.verbose
}));

//Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//Error handler
app.use(function(err, req, res, next) {
  if (config.verbose) {
    console.error(err);
  }
  
  //HTTP status code
  res.status(err.status || 500);

  //JSON output
  return res.json({ error: err.message });
});

var port = config.port || 8269;
var server = app.listen(port, function() {
  console.log('HTTP on port ' + server.address().port);
});
