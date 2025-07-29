# EOS HTLC Contract Deployment Script for Jungle4 Testnet
# Account: quicksnake34

Write-Host "EOS HTLC Contract Deployment to Jungle4" -ForegroundColor Green
Write-Host "Account: quicksnake34" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

# Check if EOSIO.CDT is installed
try {
    $eosioVersion = eosio-cpp --version 2>$null
    Write-Host "EOSIO.CDT found: $eosioVersion" -ForegroundColor Green
} catch {
    Write-Host "EOSIO.CDT not found!" -ForegroundColor Red
    Write-Host "Please install EOSIO.CDT or use online deployment:" -ForegroundColor Yellow
    Write-Host "   - EOS Studio: http://app.eosstudio.io/guest" -ForegroundColor Cyan
    Write-Host "   - Bloks.io: https://local.bloks.io/" -ForegroundColor Cyan
    exit 1
}

# Navigate to contract directory
Set-Location "contracts/eos"

Write-Host "Compiling contract..." -ForegroundColor Yellow
try {
    eosio-cpp -o fusionbridge.wasm fusionbridge.cpp
    Write-Host "WASM compilation successful" -ForegroundColor Green
} catch {
    Write-Host "WASM compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Generating ABI..." -ForegroundColor Yellow
try {
    eosio-abigen fusionbridge.cpp --output=fusionbridge.abi
    Write-Host "ABI generation successful" -ForegroundColor Green
} catch {
    Write-Host "ABI generation failed!" -ForegroundColor Red
    exit 1
}

# Check file sizes
$wasmSize = (Get-Item "fusionbridge.wasm").Length
$abiSize = (Get-Item "fusionbridge.abi").Length

Write-Host "Compiled files:" -ForegroundColor Cyan
Write-Host "   - fusionbridge.wasm ($wasmSize bytes)" -ForegroundColor White
Write-Host "   - fusionbridge.abi ($abiSize bytes)" -ForegroundColor White

Write-Host "Deploying to Jungle4 testnet..." -ForegroundColor Yellow
try {
    cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi
    Write-Host "Contract deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "Try using online tools instead:" -ForegroundColor Yellow
    Write-Host "   - EOS Studio: http://app.eosstudio.io/guest" -ForegroundColor Cyan
    Write-Host "   - Bloks.io: https://local.bloks.io/" -ForegroundColor Cyan
    exit 1
}

Write-Host "Testing contract..." -ForegroundColor Yellow
try {
    cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{
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

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "View contract at: https://jungle4.cryptolions.io/account/quicksnake34" -ForegroundColor Cyan 