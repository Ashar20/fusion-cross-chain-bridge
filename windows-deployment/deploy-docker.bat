@echo off
echo 🐳 Deploying EOS Contract using Docker...
echo ================================================

echo 📋 Checking files...
if not exist "contracts\eos\fusionbridge.wasm" (
    echo ❌ fusionbridge.wasm not found! Run compile.bat first.
    pause
    exit /b 1
)

if not exist "contracts\eos\fusionbridge.abi" (
    echo ❌ fusionbridge.abi not found! Run compile.bat first.
    pause
    exit /b 1
)

echo ✅ Compiled files found!
echo 📁 WASM: contracts\eos\fusionbridge.wasm
echo 📁 ABI: contracts\eos\fusionbridge.abi

echo.
echo 🐳 Starting Docker deployment...
echo 📡 Target: Jungle4 Testnet
echo 💰 Account: quicksnake34
echo.

REM Create a temporary directory for Docker volume mounting
if not exist "C:\temp\eos-deploy" mkdir "C:\temp\eos-deploy"
copy "contracts\eos\fusionbridge.wasm" "C:\temp\eos-deploy\"
copy "contracts\eos\fusionbridge.abi" "C:\temp\eos-deploy\"

echo 🔄 Deploying contract using Docker...
docker run --rm -v "C:/temp/eos-deploy:/work" eosio/eosio.cdt:v1.8.1 bash -c "cd /work && cleos -u https://jungle4.cryptolions.io set contract quicksnake34 . fusionbridge.wasm fusionbridge.abi"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker deployment failed!
    echo 💡 Trying alternative deployment method...
    echo.
    echo 🔄 Using Node.js deployment...
    cd ..
    node run-deployment.js
    pause
    exit /b 1
)

echo ✅ Docker deployment successful!
echo 🎉 Contract deployed to quicksnake34 on Jungle4!
echo.
echo 🧪 Testing deployment...
docker run --rm -v "C:/temp/eos-deploy:/work" eosio/eosio.cdt:v1.8.1 bash -c "cd /work && cleos -u https://jungle4.cryptolions.io get code quicksnake34"

echo.
echo 🎯 Deployment completed!
pause 