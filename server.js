var os = require('os');
var fs = require('fs');
var path = require('path');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var VBoxManage = require('./lib/VBoxManage.js');

//Command line arguments
var config = { };
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
  //console.log("  --allow [cmd1[sub1,sub2,...],cmd2,...]   Allow only specific commands");
  console.log("  --vboxmanage [path]    Path to vboxmanage executable");
  console.log("  --verbose              Enable detailed logging");
  console.log("  --version              Print version number");
  console.log("");
  console.log("Examples:");
  console.log("  vboxmanage-rest-api");
  console.log("  vboxmanage-rest-api --port 80");
  //console.log("  vboxmanage-rest-api --allow dhcpserver[add,modify],natnetwork");
}

//Detailed console output
function verbose(message) {
  if (config.verbose || process.env.NODE_VERBOSE) {
    console.log(message);
  }
}

var vboxmanage = new VBoxManage(config);

var app = express();
app.startup = new Date();
app.uptime = function() {
  return Math.ceil(new Date().getTime() - app.startup.getTime());
};

app.use(logger('dev'));
app.use(bodyParser.json());

//Wrapper around res.json function
app.use(function(req, res, next) {
  var f = res.json;
  res.json = function(data) {
    if (config.verbose) {
      res.header("Content-Type", "application/json");
      return res.end(JSON.stringify(data, " ", 2));
    }
    return f(data);
  };
  next();
});

//API status and version
app.get("/api/v1", function(req, res, next) {
  var pkg = require('./package.json');
  res.json({ name: pkg.name, version: pkg.version, uptime: app.uptime() });
});

//Execute a VBoxManage command using GET method and arguments from query string
var routes = [ "/api/v1/:command", "/api/v1/:command/:subcommands(*)" ];
app.get(routes, function(req, res, next) {
  var subcommands = (req.params.subcommands || "").split("/");
  vboxmanage.exec(req.params.command, subcommands, req.query, function(error, result) {
    if (error) return next(error);
    
    if (!config.verbose) {
      //Hide security critical parameters
      delete result.shell.command;
      delete result.shell.directory;
    }
    
    res.json(result);
  });
});

//Execute a VBoxManage command using POST method and arguments in request body
app.post(routes, function(req, res, next) {
  var subcommands = (req.params.subcommands || "").split("/");
  vboxmanage.exec(req.params.command, subcommands, req.body, function(error, result) {
    if (error) return next(error);

    if (!config.verbose) {
      //Hide security critical parameters
      delete result.shell.command;
      delete result.shell.directory;
    }
    
    res.json(result);
  });
});

//Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//Error handler
app.use(function(err, req, res, next) {
  verbose(err);
  
  //HTTP status code
  res.status(err.status || 500);

  //JSON output
  err.error = err.message;
  delete err.message;
  return res.json(err);
});

var port = config.port || 8269;
var server = app.listen(port, function() {
  console.log('HTTP on port ' + server.address().port);
});
