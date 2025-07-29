# Complete EOS HTLC Contract Deployment Script
# Handles both EOSIO.CDT and Docker deployment methods

Write-Host "Complete EOS HTLC Contract Deployment" -ForegroundColor Green
Write-Host "Account: quicksnake34" -ForegroundColor Yellow
Write-Host "Network: Jungle4 Testnet" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor White

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check for EOSIO.CDT
Write-Host "Checking for EOSIO.CDT..." -ForegroundColor Yellow
if (Test-Command "eosio-cpp") {
    Write-Host "EOSIO.CDT found!" -ForegroundColor Green
    $useEOSIOCDT = $true
} else {
    Write-Host "EOSIO.CDT not found" -ForegroundColor Red
    $useEOSIOCDT = $false
}

# Check for Docker
Write-Host "Checking for Docker..." -ForegroundColor Yellow
if (Test-Command "docker") {
    Write-Host "Docker found!" -ForegroundColor Green
    $useDocker = $true
} else {
    Write-Host "Docker not found" -ForegroundColor Red
    $useDocker = $false
}

# Determine deployment method
if ($useEOSIOCDT) {
    Write-Host "Using EOSIO.CDT for compilation" -ForegroundColor Green
    $deploymentMethod = "eosio"
} elseif ($useDocker) {
    Write-Host "Using Docker for compilation" -ForegroundColor Green
    $deploymentMethod = "docker"
} else {
    Write-Host "Neither EOSIO.CDT nor Docker found!" -ForegroundColor Red
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "   1. EOSIO.CDT: https://github.com/EOSIO/eosio.cdt/releases" -ForegroundColor Cyan
    Write-Host "   2. Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host "   3. Use online deployment: http://app.eosstudio.io/guest" -ForegroundColor Cyan
    exit 1
}

# Navigate to contract directory
Set-Location "contracts/eos"
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan

# Compile contract
Write-Host "Compiling contract..." -ForegroundColor Yellow
try {
    if ($deploymentMethod -eq "eosio") {
        # Use EOSIO.CDT
        Write-Host "Using EOSIO.CDT to compile..." -ForegroundColor Cyan
        eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
        eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
    } elseif ($deploymentMethod -eq "docker") {
        # Use Docker
        Write-Host "Using Docker to compile..." -ForegroundColor Cyan
        $absolutePath = (Get-Location).Path
        docker run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
        docker run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
    }
    
    Write-Host "Compilation successful!" -ForegroundColor Green
} catch {
    Write-Host "Compilation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check compiled files
if (!(Test-Path "fusionbridge.wasm")) {
    Write-Host "WASM file not found!" -ForegroundColor Red
    exit 1
}
if (!(Test-Path "fusionbridge.abi")) {
    Write-Host "ABI file not found!" -ForegroundColor Red
    exit 1
}

$wasmSize = (Get-Item "fusionbridge.wasm").Length
$abiSize = (Get-Item "fusionbridge.abi").Length

Write-Host "Compiled files:" -ForegroundColor Cyan
Write-Host "   - fusionbridge.wasm ($wasmSize bytes)" -ForegroundColor White
Write-Host "   - fusionbridge.abi ($abiSize bytes)" -ForegroundColor White

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "View contract at: https://jungle4.cryptolions.io/account/quicksnake34" -ForegroundColor Cyan
Write-Host "Upload these files to online deployment tools:" -ForegroundColor Yellow
Write-Host "   - fusionbridge.wasm" -ForegroundColor White
Write-Host "   - fusionbridge.abi" -ForegroundColor White
Write-Host "Online tools:" -ForegroundColor Cyan
Write-Host "   - EOS Studio: http://app.eosstudio.io/guest" -ForegroundColor White
Write-Host "   - Bloks.io: https://local.bloks.io/" -ForegroundColor White 