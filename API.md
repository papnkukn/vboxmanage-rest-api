# REST API for VBoxManage

## Getting Started

Get API status
```
curl http://localhost:8269/api/v1
```

List all virtual machines
```
curl http://localhost:8269/list/vms
```

## Authentication

No authentication mechanism integrated. Use nginx or Apache with .htpasswd as a proxy.

## Error Handling

Using standard HTTP status codes. Descriptive errors in JSON format as `{ "error": "Oops, something went wrong." }`

## Methods

### Test API connection

```
GET /api/v1
```

Response

Property                 | Type      | Description
------------------------ | --------- | ---------------------------------------------------------------------------------
version                  | string    | Major, minor and revision number, e.g. 0.6.0
uptime                   | number    | Number of milliseconds since the script started

Example
```
curl http://localhost:8269/api/v1
{"version":"0.1.0","uptime":1000}
```

### List all virtual machines

```
GET /api/v1/list/vms
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
    "directory": "n:\\source\\nodejs\\vboxmanage\\vboxmanage-rest-api",
    "exitCode": 0,
    "output": "\"Ubuntu 14.04 LTS 64-bit\" {d1822e08-5658-4c1d-ba05-4f8889304271}\r\n\"Windows 10 64-bit\" {f343d863-a993-4ad5-9bcc-3a72fab79f66}\r\n"
  }
}
```

### List running virtual machines

```
GET /api/v1/list/runningvms
```

### Get virtual machine info

```
GET /api/v1/showvminfo/:name
```

where `:name` is a virtual machine name or uuid

### Start a virtual machine

```
GET /api/v1/startvm/:name
```

where `:name` is a virtual machine name or uuid

Query string:

Property              | Type      | Description
----------------------| --------- | ---------------------------------------------------------------------------------
type                  | string    | Value: gui|sdl|headless|separate

Example
```
curl -X GET http://localhost:8269/api/v1/startvm/f343d863-a993-4ad5-9bcc-3a72fab79f66?type=gui
```

Output
```
{
  "shell": {
    "command": "vboxmanage startvm f343d863-a993-4ad5-9bcc-3a72fab79f66 --type gui",
    "directory": "n:\\source\\nodejs\\vboxmanage\\vboxmanage-rest-api",
    "exitCode": 0,
    "output": "Waiting for VM \"f343d863-a993-4ad5-9bcc-3a72fab79f66\" to power on...\r\nVM \"f343d863-a993-4ad5-9bcc-3a72fab79f66\" has been successfully started.\r\n"
  }
}
```

### Pause a virtual machine

```
GET /api/v1/controlvm/:name/pause
```

where `:name` is a virtual machine name or uuid

### Resume a virtual machine

```
GET /api/v1/controlvm/:name/resume
```

where `:name` is a virtual machine name or uuid

### Reset a virtual machine

```
GET /api/v1/controlvm/:name/reset
```

where `:name` is a virtual machine name or uuid

### Power off a virtual machine

```
GET /api/v1/controlvm/:name/poweroff
```

where `:name` is a virtual machine name or uuid

### Invoke the ACPI power button

```
GET /api/v1/controlvm/:name/acpipowerbutton
```

where `:name` is a virtual machine name or uuid