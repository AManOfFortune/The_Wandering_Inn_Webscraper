#! /bin/bash
./nodejs/node.exe ./Server/index.js &
$currentWorkingDir = pwd
./chrome/chrome.exe --app=file:\\$currentWorkingDir\Client\index.html &