@echo off

curl -X POST -H "Content-Type: application/json" -d "[ \"f343d863-a993-4ad5-9bcc-3a72fab79f66\" ]" http://localhost:8269/vboxmanage/showvminfo