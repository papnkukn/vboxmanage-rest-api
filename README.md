## Introduction

Manage VirtualBox virtual machines using REST API. Based on Node.js and VBoxManage shell commands.

`NOTE: This is an early version of REST API`

## Getting Started

<!--
Install the package:
```bash
npm install -g vboxmanage-rest-api
```
-->

Install required dependencies:
```bash
npm install
```

<!--
Start the server:
```bash
vboxmanage-rest-api --port 8269 --verbose
```
-->

Start the server:
```bash
node server.js --port 8269 --verbose
```

Open in web browser:
```
http://localhost:8269/api/v1/list/vms
```

## Command Line

```
Usage:
  vboxmanage-rest-api [options]

Options:
  --help                 Print this message
  --port, -p [num]       HTTP port number, default: 8269
  --vboxmanage [path]    Path to vboxmanage executable
  --verbose              Enable detailed logging
  --version              Print version number

Examples:
  vboxmanage-rest-api
  vboxmanage-rest-api --port 80
```

## REST API

See [REST API Documentation](API.md)
