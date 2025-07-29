# EOS Contract Compilation Script
# Alternative compilation methods

Write-Host "EOS Contract Compilation" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor White

# Navigate to contract directory
Set-Location "contracts/eos"
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan

# Check if source files exist
if (!(Test-Path "fusionbridge.cpp")) {
    Write-Host "Error: fusionbridge.cpp not found!" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "fusionbridge.hpp")) {
    Write-Host "Error: fusionbridge.hpp not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Source files found:" -ForegroundColor Green
Write-Host "  - fusionbridge.cpp" -ForegroundColor White
Write-Host "  - fusionbridge.hpp" -ForegroundColor White

# Try to use existing compiled files if they exist
if (Test-Path "fusionbridge.wasm") {
    Write-Host "WASM file already exists!" -ForegroundColor Green
    $wasmSize = (Get-Item "fusionbridge.wasm").Length
    Write-Host "  Size: $wasmSize bytes" -ForegroundColor White
} else {
    Write-Host "WASM file not found - needs compilation" -ForegroundColor Yellow
}

if (Test-Path "fusionbridge.abi") {
    Write-Host "ABI file already exists!" -ForegroundColor Green
    $abiSize = (Get-Item "fusionbridge.abi").Length
    Write-Host "  Size: $abiSize bytes" -ForegroundColor White
} else {
    Write-Host "ABI file not found - needs compilation" -ForegroundColor Yellow
}

# Check for EOSIO.CDT
Write-Host "Checking for EOSIO.CDT..." -ForegroundColor Yellow
try {
    $eosioVersion = eosio-cpp --version 2>$null
    Write-Host "EOSIO.CDT found: $eosioVersion" -ForegroundColor Green
    
    # Compile with EOSIO.CDT
    Write-Host "Compiling with EOSIO.CDT..." -ForegroundColor Cyan
    eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
    eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
    
    Write-Host "Compilation successful!" -ForegroundColor Green
} catch {
    Write-Host "EOSIO.CDT not available" -ForegroundColor Red
}

# Check for Docker
Write-Host "Checking for Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
    
    # Compile with Docker
    Write-Host "Compiling with Docker..." -ForegroundColor Cyan
    $absolutePath = (Get-Location).Path
    docker run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
    docker run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
    
    Write-Host "Compilation successful!" -ForegroundColor Green
} catch {
    Write-Host "Docker not available" -ForegroundColor Red
}

# Final check
if (Test-Path "fusionbridge.wasm") {
    $wasmSize = (Get-Item "fusionbridge.wasm").Length
    Write-Host "WASM file: $wasmSize bytes" -ForegroundColor Green
} else {
    Write-Host "WASM file not created" -ForegroundColor Red
}

if (Test-Path "fusionbridge.abi") {
    $abiSize = (Get-Item "fusionbridge.abi").Length
    Write-Host "ABI file: $abiSize bytes" -ForegroundColor Green
} else {
    Write-Host "ABI file not created" -ForegroundColor Red
}

Write-Host "Compilation process complete!" -ForegroundColor Green
Write-Host "Files location: $(Get-Location)" -ForegroundColor Cyan 