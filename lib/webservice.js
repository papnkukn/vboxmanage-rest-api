module.exports = function(options) {
  var express = require('express');
  var parser = require('body-parser');
  var app = express();
  app.use(parser.json());

  var defaults = { };
  
  //Merge objects, options overwrite defaults
  options = Object.assign({ }, defaults, options || { });
  
  var VBoxManage = require('./VBoxManage.js');
  var vboxmanage = new VBoxManage(options);
  
  //Test the vboxmanage command
  vboxmanage.exec([ "-v" ], function(error, result) {
    if (error) {
      if (options.verbose) {
        console.error(error);
      }
      console.error("Cannot invoke vboxmanage! Hint: try to run 'vboxmanage -v' in the command line.");
      process.exit(1);
    }
  });
  
  function handle(req, res, next) {
    try {
      var args = (req.params.args || "").split("/");
      args = vboxmanage.merge([ args, req.body, req.query ]);
      //return res.end(JSON.stringify(args, " ", 2));
      vboxmanage.exec(args, function(error, result) {
        if (error) return next(error);
        
        if (!options.verbose) {
          //Hide security critical parameters
          //delete result.shell.command;
          //delete result.shell.directory;
          delete result.shell;
        }
        
        if (options.verbose) {
          res.header("Content-Type", "application/json");
          return res.end(JSON.stringify(result, " ", 2));
        }
        
        res.json(result);
      });
    }
    catch (e) {
      next(e);
    }
  }

  //Execute a VBoxManage command using GET method and arguments from query string
  app.get("/vboxmanage/:args(*)", handle);

  //Execute a VBoxManage command using POST method and arguments in request body
  app.post("/vboxmanage/:args(*)", handle);
  
  //Catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var error = new Error('Not Found');
    error.status = 404;
    next(error);
  });

  //Error handler
  app.use(function(error, req, res, next) {
    res.status(error.status || 500);
    var result = {
      error: error.message
    };
    if (options.verbose && error.shell) {
      result.shell = error.shell;
    }
    if (options.verbose) {
      res.header("Content-Type", "application/json");
      return res.end(JSON.stringify(result, " ", 2));
    }
    return res.json(result);
  });

  return app;
}