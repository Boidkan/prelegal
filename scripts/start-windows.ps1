# Start Prelegal on Windows: build the image and run the container.
$ErrorActionPreference = "Stop"

# Resolve the repo root regardless of where the script is called from.
$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RootDir

Write-Host "Building and starting Prelegal..."
docker compose up --build -d

Write-Host "Waiting for the backend to become healthy..."
for ($i = 0; $i -lt 30; $i++) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 3 | Out-Null
        Write-Host "Prelegal is ready at http://localhost:8000"
        exit 0
    } catch {
        Start-Sleep -Seconds 2
    }
}

Write-Error "Backend did not become healthy in time. Check logs with: docker compose logs"
exit 1
