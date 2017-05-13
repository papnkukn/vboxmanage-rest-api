var VBoxManage = require('../lib/VBoxManage.js');
var vboxmanage = new VBoxManage();

exports["merge"] = function(test) {
  //test.expect(1);
  
  var args = [ ];
  
  args = vboxmanage.merge([ "controlvm", "{uuid}", "poweroff" ]);
  //console.log(args);
  test.ok(args.length == 3, "Expected 3 arguments");
  
  args = vboxmanage.merge([ "command", { "vm": "{uuid}", "flag": true } ]);
  //console.log(args);
  test.ok(args.length == 4, "Expected 4 arguments");
  
  test.done();
};

exports["parse list"] = function(test) {
  var fixture =
    '"<inaccessible>" {59140286-3e31-4eb7-9105-119fae95d114}\r\n' +
    '"<inaccessible>" {5dc761bd-5e81-4839-a692-603d5bf85b06}\r\n' +
    '"Ubuntu 14.04 LTS 64-bit" {d1822e08-5658-4c1d-ba05-4f8889304271}\r\n';

  var result = vboxmanage.parse("list", fixture);
  //console.log(result);
  test.ok(typeof result == 'object');
  test.ok(result.list);
  test.ok(result.list.length == 3);
  test.ok(result.list[0].uuid == "59140286-3e31-4eb7-9105-119fae95d114");
  test.ok(result.list[2].name == "Ubuntu 14.04 LTS 64-bit");
  
  test.done();
};

exports["parse showvminfo"] = function(test) {
  var fixture =
    'Name:            Windows 10 64-bit\r\n' +
    'Groups:          /\r\n' +
    'Guest OS:        Windows 10 (64-bit)\r\n' +
    'UUID:            f343d863-a993-4ad5-9bcc-3a72fab79f66\r\n' +
    'Config file:     x:\vbox\Windows 10 64-bit\Windows 10 64-bit.vbox\r\n' +
    'Snapshot folder: x:\vbox\Windows 10 64-bit\Snapshots\r\n' +
    'Log folder:      x:\vbox\Windows 10 64-bit\Logs\r\n' +
    'Hardware UUID:   f343d863-a993-4ad5-9bcc-3a72fab79f66\r\n' +
    'Memory size:     8192MB\r\n' +
    'Page Fusion:     off\r\n' +
    'VRAM size:       128MB\r\n' +
    'CPU exec cap:    100%\r\n' +
    'HPET:            off\r\n' +
    'Chipset:         piix3\r\n' +
    'Firmware:        BIOS\r\n' +
    'Number of CPUs:  1\r\n' +
    'PAE:             off\r\n' +
    'Long Mode:       on\r\n' +
    'CPUID Portability Level: 0\r\n' +
    'CPUID overrides: None\r\n' +
    'Boot menu mode:  message and menu\r\n' +
    'Boot Device (1): Floppy\r\n' +
    'Boot Device (2): DVD\r\n' +
    'Boot Device (3): HardDisk\r\n' +
    'Boot Device (4): Not Assigned\r\n' +
    'ACPI:            on\r\n' +
    'IOAPIC:          on\r\n' +
    'Time offset:     0ms\r\n' +
    'RTC:             local time\r\n' +
    'Hardw. virt.ext: on\r\n' +
    'Nested Paging:   on\r\n' +
    'Large Pages:     on\r\n' +
    'VT-x VPID:       on\r\n' +
    'VT-x unr. exec.: on\r\n' +
    'Paravirt. Provider: Default\r\n' +
    'State:           powered off (since 2017-05-06T17:40:58.000000000)\r\n' +
    'Monitor count:   1\r\n' +
    '3D Acceleration: on\r\n' +
    '2D Video Acceleration: on\r\n' +
    'Teleporter Enabled: off\r\n';

  var result = vboxmanage.parse("showvminfo", fixture);
  console.log(result);
  test.ok(typeof result == 'object');
  test.ok(typeof result.name == 'string');
  test.ok(typeof result.uuid == 'string');
  test.ok(typeof result.state == 'string');
  
  test.done();
};