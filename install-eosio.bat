@echo off
echo 🚀 EOSIO INSTALLATION AND ABI DEPLOYMENT
echo ================================================

echo 📋 Step 1: Downloading EOSIO...
echo.

REM Create directory for EOSIO
if not exist "C:\eosio" mkdir "C:\eosio"
cd "C:\eosio"

REM Download EOSIO (using PowerShell)
echo 🔄 Downloading EOSIO software...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/EOSIO/eos/releases/download/v2.1.0/eos_2.1.0-1-ubuntu-18.04_amd64.deb' -OutFile 'eos.deb'}"

if exist "eos.deb" (
    echo ✅ Download successful!
    echo.
    echo 📋 Step 2: Extracting EOSIO...
    echo ⚠️  Note: You may need to install 7-Zip or WinRAR to extract .deb files
    echo.
    echo 📋 Step 3: Add to PATH
    echo Please add C:\eosio\bin to your system PATH
    echo.
    echo 📋 Step 4: Deploy ABI
    echo Once EOSIO is installed, run:
    echo cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\eos\fusionbridge.abi
) else (
    echo ❌ Download failed!
    echo.
    echo 📋 Alternative: Manual Installation
    echo 1. Go to: https://github.com/EOSIO/eos/releases
    echo 2. Download the latest Windows release
    echo 3. Extract to C:\eosio
    echo 4. Add C:\eosio\bin to PATH
    echo 5. Run: cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\eos\fusionbridge.abi
)

echo.
echo 🎯 Current Status:
echo ✅ Contract Code: DEPLOYED
echo ❌ Contract ABI: PENDING
echo.
echo 📁 ABI file location: contracts\eos\fusionbridge.abi
echo.

pause 