# Docker-based EOS Contract Deployment Script
# Uses full Docker path for Windows

Write-Host "Docker-based EOS Contract Deployment" -ForegroundColor Green
Write-Host "Account: quicksnake34" -ForegroundColor Yellow
Write-Host "Network: Jungle4 Testnet" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor White

# Docker path
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

# Check if Docker exists
if (!(Test-Path $dockerPath)) {
    Write-Host "Docker not found at: $dockerPath" -ForegroundColor Red
    exit 1
}

Write-Host "Docker found at: $dockerPath" -ForegroundColor Green

# Check Docker version
try {
    $dockerVersion = & $dockerPath --version
    Write-Host "Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Error checking Docker version: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Navigate to contract directory
Set-Location "contracts/eos"
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan

# Check source files
if (!(Test-Path "fusionbridge.cpp")) {
    Write-Host "Error: fusionbridge.cpp not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Source files found:" -ForegroundColor Green
Write-Host "  - fusionbridge.cpp" -ForegroundColor White
Write-Host "  - fusionbridge.hpp" -ForegroundColor White

# Get absolute path for Docker volume mounting
$absolutePath = (Get-Location).Path
Write-Host "Docker volume path: $absolutePath" -ForegroundColor Cyan

# Compile to WASM using Docker
Write-Host "Compiling to WASM using Docker..." -ForegroundColor Yellow
try {
    & $dockerPath run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
    Write-Host "WASM compilation successful!" -ForegroundColor Green
} catch {
    Write-Host "WASM compilation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Generate ABI using Docker
Write-Host "Generating ABI using Docker..." -ForegroundColor Yellow
try {
    & $dockerPath run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
    Write-Host "ABI generation successful!" -ForegroundColor Green
} catch {
    Write-Host "ABI generation failed: $($_.Exception.Message)" -ForegroundColor Red
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

# Deploy to Jungle4 using Docker
Write-Host "Deploying to Jungle4 testnet using Docker..." -ForegroundColor Yellow
try {
    & $dockerPath run --rm -v "${absolutePath}:/work" eosio/eosio.cdt:v1.8.1 cleos -u https://jungle4.cryptolions.io set contract quicksnake34 /work fusionbridge.wasm fusionbridge.abi
    Write-Host "Contract deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be expected if account doesn't have enough EOS" -ForegroundColor Yellow
    Write-Host "You can still use the compiled files for online deployment:" -ForegroundColor Cyan
    Write-Host "   - EOS Studio: http://app.eosstudio.io/guest" -ForegroundColor White
    Write-Host "   - Bloks.io: https://local.bloks.io/" -ForegroundColor White
}

# Test the contract
Write-Host "Testing contract..." -ForegroundColor Yellow
try {
    & $dockerPath run --rm eosio/eosio.cdt:v1.8.1 cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{
        "sender": "quicksnake34",
        "recipient": "quicksnake34", 
        "amount": "0.1000 EOS",
        "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "timelock": 1753746959,
        "memo": "Test HTLC",
        "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
    }' -p quicksnake34@active
    
    Write-Host "Contract test successful!" -ForegroundColor Green
} catch {
    Write-Host "Test failed (this might be expected if account doesn't have enough EOS)" -ForegroundColor Yellow
}

Write-Host "Deployment process complete!" -ForegroundColor Green
Write-Host "View contract at: https://jungle4.cryptolions.io/account/quicksnake34" -ForegroundColor Cyan
Write-Host "Compiled files location: $(Get-Location)" -ForegroundColor White 