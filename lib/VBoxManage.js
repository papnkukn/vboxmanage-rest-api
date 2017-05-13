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
 * [deprecated] Checks if the specified command (and subcommand) is allowed to execute.
 * Note: this method is deprecated, use the "verify" method instead
 * @param command    Command name
 * @param subcommand Optional subcommand name
 ******************************************************************************************/
VBoxManage.prototype.isCommandAllowed = function(command, subcommand) {
  //Simple rule of check
  return /^[a-z]+$/gi.test(command);
};

/**************************************************************************************//**
 * Checks if the specified arguments are allowed to execute.
 * @param args Array of VBoxManage arguments
 ******************************************************************************************/
VBoxManage.prototype.verify = function(args) {
  if (!args) {
    throw new Error("Arguments are missing!");
  }
  
  if (Object.prototype.toString.call(args) !== '[object Array]') {
    throw new Error("Expected an array for arguments!");
  }
  
  if (args.length > 0 && !/^[\w\d\-]+$/gi.test(args[0])) {
    throw new Error("Command not allowed: " + args[0]);
  }

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
  this.exec([ "controlvm", name, "poweroff" ], callback);
};

/**************************************************************************************//**
 * Executes a command (and subcommand) using VBoxManage in command line
 * @param callback function(error, result)
 ******************************************************************************************/
VBoxManage.prototype.merge = function(objects) {
  var self = this;
  
  var args = [ ];
  
  function build(options) {
    //Build command line arguments
    if (/string|number/.test(typeof options)) {
      args.push(options);
    }
    else if (Object.prototype.toString.call(options) === '[object Array]') {
      for (var i = 0; i < options.length; i++) {
        if (Object.prototype.toString.call(options[i]) === '[object Array]') {
          //Recursive call
          build(options[i]);
        }
        else if (typeof options[i] == 'object') {
          //Recursive call
          build(options[i]);
        }
        else if (/string|number/.test(typeof options[i])) {
          args.push(options[i]);
        }
        else {
          throw new Error("Unknown argument type: " + typeof options[i] + " = " + options[i]);
        }
      }
    }
    else if (typeof options == 'object') {
      var keys = Object.keys(options);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (options.hasOwnProperty(key)) {
          var value = options[key];
          //console.log(key + "=" + value);
          
          if (Object.prototype.toString.call(value) === '[object Array]') {
            value = value.join(",");
          }
          
          if (/string|number/.test(typeof value)) {
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
    else {
      throw new Error("Unknown argument type: " + typeof options + " = " + options);
    }
  }
  
  build(objects);
  
  return args;
};

/**************************************************************************************//**
 * Executes a command (and subcommand) using VBoxManage in command line
 * @param callback function(error, result)
 ******************************************************************************************/
VBoxManage.prototype.exec = function(args, callback) {
  var self = this;
  
  try {
    //Verify command line arguments
    self.verify(args);
    
    //Execute a shell command
    var cwd = self.options.cwd;
    var cmd = self.options.vboxmanage;
    self.invokeShellCommand(cmd, { args: args, cwd: cwd }, function(error, response) {
      if (error) return callback(error);
    
      //Build result object
      var result = {
        shell: response
      };
      
      //Parse shell output
      var parsed = self.parse(args[0], response.output);
      result = Object.assign({ }, parsed || { }, result);
      
      callback(null, result);
    });
  }
  catch (e) {
    callback(e);
  }
};

/**************************************************************************************//**
 * Parses a command line output
 * @param command Command name
 * @param output  Shell output (stdout and stderr combined)
 ******************************************************************************************/
VBoxManage.prototype.parse = function(command, output) {
  var self = this;
  
  if (command == "-v" || command == "--version" || command == "version") {
    var version = output.replace(/[\r\n]+/, "");
    return { version: version };
  }
  
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
    //Name:            Windows 10 64-bit
    //Groups:          /
    //UUID:            f343d863-a993-4ad5-9bcc-3a72fab79f66
    //State:           powered off (since 2017-05-06T17:40:58.000000000)
    
    var dictionary = { };
    
    var match;
    var regex = /^(.*?):\s+(.*)$/gim;
    while (match = regex.exec(output)) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      
      var name = match[1].trim();
      var value = match[2].trim();
      dictionary[name] = value;
    }
    
    var result = {
      name: dictionary["Name"],
      uuid: dictionary["UUID"],
      //guest_os: dictionary["Guest OS"],
      ram: dictionary["Memory size"],
      vram: dictionary["VRAM size"],
      state: dictionary["State"]
    }
    
    //Remove value in brackets ( )
    //State: powered off (since 2017-05-06T17:40:58.000000000)
    if (result.state && !/^[\w\s]+$/gi.test(result.state)) {
      result.state = /^([\w\s]+)/gi.exec(result.state)[1].trim();
    }
    
    return result;
  }
  
  if (self.options.verbose) {
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
    var result = {
      command: command + " " + options.args.join(" "),
      directory: options.cwd,
      exitCode: code,
      output: output
    };
    var error = null;
    if (code != 0) {
      error = new Error("Exit code " + code);
      error.shell = result;
    }
    callback(error, result);
    proc = null;
  });
};

module.exports = VBoxManage;