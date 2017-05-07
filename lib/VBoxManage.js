var os = require('os');
var fs = require('fs');
var path = require('path');

/**************************************************************************************//**
 * Constructor
 * @param options Object with arguments
 ******************************************************************************************/
function VBoxManage(options) {
  var self = this;
  self.events = { };

  //Default option values
  var defaults = {
    verbose: false,
    vboxmanage: "vboxmanage",
    cwd: process.cwd()
  };
  
  //Merge objects
  self.options = Object.assign({ }, defaults, options || { });
  
  if (!self.options.vboxmanage) {
    throw new Error("Missing required 'vboxmanage' parameter!");
  }
};

/**************************************************************************************//**
 * Checks if the specific command (and subcommand) is allowed to execute.
 * @param command    Command name
 * @param subcommand Optional subcommand name
 ******************************************************************************************/
VBoxManage.prototype.isCommandAllowed = function(command, subcommand) {
  //Simple rule of check
  return /^[a-z]+$/gi.test(command);

  //TODO: Implement to check each argument
  /*
  function flags(s) {
    return s.split("|");
  }
  VBoxManage.commands = [
    {
      command: "list",
      optional: flags("--long|-l"),
      subcommands: "vms|runningvms|ostypes|hostdvds|hostfloppies|intnets|bridgedifs|hostonlyifs|natnets|dhcpservers|hostinfo|hostcpuids|hddbackends|hdds|dvds|floppies|usbhost|usbfilters|systemproperties|extpacks|groups|webcams|screenshotformats".split('|'),
    }
  ];
  */
  
  //return true;
};

/**************************************************************************************//**
 * Powers off a virtual machine
 * @param options  Virtual machine name or uuid
 * @param callback function(error, result)
 ******************************************************************************************/
VBoxManage.prototype.poweroff = function(name, callback) {
  this.exec("controlvm", [ name, "poweroff" ], callback);
};

/**************************************************************************************//**
 * Executes a command (and subcommand) using VBoxManage in command line
 * @param callback function(error, result)
 ******************************************************************************************/
VBoxManage.prototype.exec = function(command, subcommand, options, callback) {
  var self = this;
  
  if (!self.isCommandAllowed(command, subcommand)) {
    return callback(new Error("Command not allowed: " + command));
  }
  
  var args = [ ];
  args.push(command);
  if (Object.prototype.toString.call(subcommand) === '[object Array]') {
    for (var i = 0; i < subcommand.length; i++) {
      args.push(subcommand[i]);
    }
  }
  else if (subcommand) {
    args.push(subcommand);
  }
  
  //Build command line arguments
  if (Object.prototype.toString.call(options) === '[object Array]') {
    for (var i = 0; i < options.length; i++) {
      args.push(options[i]);
    }
  }
  else {
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (options.hasOwnProperty(key)) {
        var value = options[key];
        //console.log(key + "=" + value);
        
        if (Object.prototype.toString.call(value) === '[object Array]') {
          value = value.join(",");
        }
        
        if (typeof value === 'string' || typeof value === 'numeric') {
          args.push("--" + key);
          if (value != "") {
            args.push(value);
          }
        }
        else if (typeof value === 'boolean') {
          args.push("--" + key);
        }
      }
    }
  }
  
  //Execute a shell command
  var cwd = self.options.cwd;
  var cmd = self.options.vboxmanage;
  self.invokeShellCommand(cmd, { args: args, cwd: cwd }, function(error, response) {
    //Build result object
    var result = {
      shell: {
        command: cmd + " " + args.join(" "),
        directory: cwd,
        exitCode: response.exitCode,
        output: response.output
      }
    };
    
    //Parse shell output
    var parsed = self.parse(command, response.output);
    result = Object.assign({ }, parsed || { }, result);
    
    callback(error, result);
  });
};

/**************************************************************************************//**
 * Parses a command line output
 * @param command Command name
 * @param output  Shell output (stdout and stderr combined)
 ******************************************************************************************/
VBoxManage.prototype.parse = function(command, output) {
  if (command == "list") {
    //console.log(output);
    //"<inaccessible>" {59140286-3e31-4eb7-9105-119fae95d114}
    //"<inaccessible>" {5dc761bd-5e81-4839-a692-603d5bf85b06}
    //"Ubuntu 14.04 LTS 64-bit" {d1822e08-5658-4c1d-ba05-4f8889304271}
    
    var result = {
      list: [ ]
    };
    
    var match;
    var regex = /^"(.*?)"\s\{([0-9A-Z\-]+)\}$/gim;
    while (match = regex.exec(output)) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      result.list.push({
        uuid: match[2],
        name: match[1]
      });
    }
    
    return result;
  }
  
  if (command == "showvminfo") {
    //TODO: Implement parser for showvminfo
  }
  
  if (this.options.verbose) {
    console.log(output);
  }
};

/**************************************************************************************//**
 * Starts a new process, pipes output messages, and sends back the exit code when done
 ******************************************************************************************/
VBoxManage.prototype.invokeShellCommand = function(command, options, callback) {
  var self = this;
	var cp = require('child_process');
  
  if (self.options.verbose) {
    console.log("shell: " + command + " " + options.args.join(" "));
  }
	
	//NOTE: 'spawn' is used instead of 'exec' for security reasons
  var output = "";
	proc = cp.spawn(command, options.args, { cwd: options.cwd });
	proc.stdout.setEncoding('utf8');
	proc.stdout.on('data', function (chunk) {
    output += chunk;
	});
	proc.stderr.setEncoding('utf8');
	proc.stderr.on('data', function (chunk) {
    output += chunk;
	});
	proc.on('error', function (err) { //Exit code not 0
		proc = null;
		if (err.code === "OK") {
      var error = new Error("Exit code not 0");
      error.output = output;
      callback(error);
			return;
		}
		if (self.options.verbose) {
			console.log('spawn error:', err);
		}
    var error = new Error(err.message);
    error.output = output;
    callback(error);
	});
	proc.on('exit', function (code) { //Only when exit code = 0 on Windows
		if (self.options.verbose) {
			console.log("spawn exit code: " + code);
		}
    var error = null;
    if (code != 0) {
      error = new Error("Exit code " + code);
		}
    var result = {
      exitCode: code,
      output: output
    };
    if (error) {
      error = Object.assign({ }, error, result || { });
    }
		callback(error, result);
		proc = null;
	});
};

module.exports = VBoxManage;