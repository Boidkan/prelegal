# Stop Prelegal on Windows and remove the container.
$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RootDir

Write-Host "Stopping Prelegal..."
docker compose down
Write-Host "Stopped."
