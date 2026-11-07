# PayShield AI - Forwarder from web-app subdirectory to root dev-all.ps1
$rootDir = (Resolve-Path "$PSScriptRoot\..\..").Path
& "$rootDir\scripts\dev-all.ps1"
