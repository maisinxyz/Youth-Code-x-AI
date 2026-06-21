# Engram backend task runner (Windows PowerShell)
# Usage: .\tasks.ps1 <target>
# Targets: verify-backend, test, serve

param([string]$Target = "verify-backend")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Always run from backend/ so pytest.ini is found regardless of caller CWD
Set-Location $PSScriptRoot

function Invoke-VerifyBackend {
    Write-Host "==> Running full test suite..." -ForegroundColor Cyan
    python -m pytest --tb=short -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: test suite did not pass." -ForegroundColor Red
        exit 1
    }
    Write-Host "==> All tests passed. Backend verified." -ForegroundColor Green
}

function Invoke-Test {
    python -m pytest --tb=short @args
}

function Invoke-Serve {
    Write-Host "==> Starting Engram backend on port 8000..." -ForegroundColor Cyan
    uvicorn app.main:app --reload --port 8000
}

switch ($Target) {
    "verify-backend" { Invoke-VerifyBackend }
    "test"           { Invoke-Test }
    "serve"          { Invoke-Serve }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Available: verify-backend, test, serve"
        exit 1
    }
}
