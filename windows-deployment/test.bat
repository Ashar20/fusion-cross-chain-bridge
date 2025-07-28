@echo off
echo 🧪 Testing EOS HTLC Contract...

echo 📋 Creating test HTLC...
cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": 1753746959,
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}' -p quicksnake34@active

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Test failed!
    pause
    exit /b 1
)

echo ✅ Test successful!
pause
