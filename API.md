# VBoxManage REST API

## Getting Started

Start the server
```
vboxmanage-rest-api --port 8269 --prefix / --verbose
```

Get API status
```
curl http://localhost:8269/
```

List all virtual machines
```
curl http://localhost:8269/vboxmanage/list/vms
```

## Verbose mode

Verbose mode adds the `shell` property to each response object (except the "Test API connection")

Property                 | Type      | Description
------------------------ | --------- | ---------------------------------------------------------------------------------
command                  | string    | Command line: vboxmanage with arguments
directory                | string    | Current working directory where the command has been issued
exitCode                 | number    | Exit code of the vboxmanage process
output                   | string    | Console output, both stdout and stderr merged

## Authentication

No authentication mechanism integrated. Use nginx or Apache with .htpasswd as a proxy.

## Error Handling

Using standard HTTP status codes. Descriptive errors in JSON format as `{ "error": "Oops, something went wrong." }`

For example starting an unknown virtual machine named 'undefined'
```
curl -X GET http://localhost:8269/vboxmanage/startvm/undefined?type=headless
```

will throw error
```json
{
  "error": "Exit code 1",
  "shell": {
    "command": "vboxmanage startvm undefined --type headless",
    "directory": "c:\\temp",
    "exitCode": 1,
    "output": "vboxmanage.exe: error: Could not find a registered machine named 'undefined'\r\nvboxmanage.exe: error: Details: code VBOX_E_OBJECT_NOT_FOUND (0x80bb0001), component VirtualBoxWrap, interface IVirtualBox, callee IUnknown\r\nvboxmanage.exe: error: Context: \"FindMachine(Bstr(pszVM).raw(), machine.asOutParam())\" at line 572 of file VBoxManageMisc.cpp\r\n"
  }
}
```

## Methods

Note: all methods are listed with the root `/` prefix.

REST API invokes a shell command vboxmanage with arguments using a node spawn method which prevents shell injection attacks. Arguments are specified in URL and separated by slash `/`
```
/vboxmanage/arg1/arg2/...
```

So for example running a command in shell
```
vboxmanage startvm {uuid} --type gui
```

can be translated to
```
GET /vboxmanage/startvm/{uuid}/--type/gui
```

or when using arguments with `--` prefix
```
GET /vboxmanage/startvm/{uuid}?type=gui
```

or when you want to hide arguments in URL use POST method with arguments in body
```
POST /vboxmanage/startvm
[ "{uuid}", "--type", "gui" ]
```

### Test API connection

```
GET /
```

Response

Property                 | Type      | Description
------------------------ | --------- | ---------------------------------------------------------------------------------
name                     | string    | Name of the instance
version                  | string    | Major, minor and revision number, e.g. 0.6.0
uptime                   | number    | Number of milliseconds since the script started

Example
```
curl http://localhost:8269/
{"name": "vboxmanage-rest-api","version":"0.2.0","uptime":1000}
```

### List all virtual machines

```
GET /vboxmanage/list/vms
```

Example output on Windows
```json
{
  "list": [
    {
      "uuid": "d1822e08-5658-4c1d-ba05-4f8889304271",
      "name": "Ubuntu 14.04 LTS 64-bit"
    },
    {
      "uuid": "f343d863-a993-4ad5-9bcc-3a72fab79f66",
      "name": "Windows 10 64-bit"
    }
  ],
  "shell": {
    "command": "c:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe list vms",
    "directory": "c:\\temp",
    "exitCode": 0,
    "output": "\"Ubuntu 14.04 LTS 64-bit\" {d1822e08-5658-4c1d-ba05-4f8889304271}\r\n\"Windows 10 64-bit\" {f343d863-a993-4ad5-9bcc-3a72fab79f66}\r\n"
  }
}
```

### List running virtual machines

```
GET /vboxmanage/list/runningvms
```

### Get virtual machine info

```
GET /vboxmanage/showvminfo/:name
```

where `:name` is a virtual machine name or uuid

Property                 | Type      | Description
------------------------ | --------- | ---------------------------------------------------------------------------------
name                     | string    | Virtual machine name
uuid                     | string    | Virtual machine id
ram                      | string    | Memory size, e.g. 8192MB
vram                     | string    | Video memory size, e.g. 128MB
state                    | string    | Virtual machine state: powered off, running, paused, etc.

Example
```
curl -X GET http://localhost:8269/vboxmanage/showvminfo/f343d863-a993-4ad5-9bcc-3a72fab79f66
```

Output
```json
{
  "name": "Windows 10 64-bit",
  "uuid": "f343d863-a993-4ad5-9bcc-3a72fab79f66",
  "ram": "8192MB",
  "vram": "128MB",
  "state": "paused"
}
```

### Start a virtual machine

```
GET /vboxmanage/startvm/:name
```

where `:name` is a virtual machine name or uuid

Query string:

Property              | Type      | Description
----------------------| --------- | ---------------------------------------------------------------------------------
type                  | string    | Value: gui, sdl, headless, separate

Example
```
curl -X GET http://localhost:8269/vboxmanage/startvm/f343d863-a993-4ad5-9bcc-3a72fab79f66?type=gui
```

Output
```json
{
  "shell": {
    "command": "vboxmanage startvm f343d863-a993-4ad5-9bcc-3a72fab79f66 --type gui",
    "directory": "c:\\temp",
    "exitCode": 0,
    "output": "Waiting for VM \"f343d863-a993-4ad5-9bcc-3a72fab79f66\" to power on...\r\nVM \"f343d863-a993-4ad5-9bcc-3a72fab79f66\" has been successfully started.\r\n"
  }
}
```

### Pause a virtual machine

```
GET /vboxmanage/controlvm/:name/pause
```

where `:name` is a virtual machine name or uuid

Example
```
curl -X GET http://localhost:8269/vboxmanage/controlvm/f343d863-a993-4ad5-9bcc-3a72fab79f66/pause
```

Output
```json
{
  "shell": {
    "command": "vboxmanage controlvm f343d863-a993-4ad5-9bcc-3a72fab79f66 pause",
    "directory": "c:\\temp",
    "exitCode": 0,
    "output": ""
  }
}
```

### Resume a virtual machine

```
GET /vboxmanage/controlvm/:name/resume
```

where `:name` is a virtual machine name or uuid

### Reset a virtual machine

```
GET /vboxmanage/controlvm/:name/reset
```

where `:name` is a virtual machine name or uuid

### Power off a virtual machine

```
GET /vboxmanage/controlvm/:name/poweroff
```

where `:name` is a virtual machine name or uuid

### Invoke the ACPI power button

```
GET /vboxmanage/controlvm/:name/acpipowerbutton
```

where `:name` is a virtual machine name or uuid

### Other features

Any vboxmanage command can be invoked via REST API using `/vboxmanage/arg1/arg2/.../argn`

However, some commands do not make a nice JSON output since the parsing of console output is not yet implemented.
