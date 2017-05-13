## Introduction

Manage VirtualBox virtual machines using REST API. Based on Node.js and VBoxManage shell commands.

## Getting Started

Install the package:
```bash
npm install -g vboxmanage-rest-api
```

Make sure the VirtualBox is installed:
```bash
vboxmanage -v
```

Start the server:
```bash
vboxmanage-rest-api --port 8269 --verbose
```

Open in web browser:
```
http://localhost:8269/vboxmanage/list/vms
```

## REST API

See [REST API Documentation](API.md)

## Using with Express

```javascript
var express = require('express');
var app = express();

//Register the VBoxManage REST API with the prefix
var vboxservice = require('vboxmanage-rest-api');
app.use("/api/v1", vboxservice({ verbose: true }));

var port = 8269;
var server = app.listen(port, function() {
  console.log('HTTP on port ' + server.address().port);
});
```

## Command Line

```
Usage:
  vboxmanage-rest-api [options]

Options:
  --help                 Print this message
  --port, -p [num]       HTTP port number, default: 8269
  --prefix [path]        URL prefix: '/' for root or '/api/v1' etc.
  --vboxmanage [path]    Path to vboxmanage executable
  --verbose              Enable detailed logging
  --version              Print version number

Examples:
  vboxmanage-rest-api
  vboxmanage-rest-api --port 80
  vboxmanage-rest-api --prefix /api/v1 --verbose
```

## Troubleshooting

### No output or blank `{ }` object 

Run the server with `--verbose` argument to see what is happening
```
node server --vboxmanage %PROGRAMFILES%\Oracle\VirtualBox\VBoxManage.exe
```

The verbose argument also adds `shell` property to the JSON object on the HTTP response.
```javascript
{
  "shell": {
    "command": "vboxmanage controlvm f343d863-a993-4ad5-9bcc-3a72fab79f66 pause",
    "directory": "c:\\temp",
    "exitCode": 0,
    "output": ""
  }
}
```

### Got an error message "spawn vboxmanage ENOENT"

In case of
```javascript
{"error":"spawn vboxmanage ENOENT"}
```
put the VirtualBox bin directory to the `PATH` environment variable

Windows:
```
set PATH=%PATH%;%PROGRAMFILES%\Oracle\VirtualBox
vboxmanage-rest-api --version
```

or start the server with `--vboxmanage` argument
```
vboxmanage-rest-api --vboxmanage "%PROGRAMFILES%\Oracle\VirtualBox\VBoxManage.exe"
```

### Got an error "EADDRINUSE"

EADDRINUSE indicates that the request socket port is in use.
```
Error: listen EADDRINUSE :::8269
```

Use another port number, e.g. 1324
```
vboxmanage-rest-api --port 1324
```