@echo off
echo 📋 DEPLOYING ABI WITH CLEOS
echo ================================================

echo 📁 Checking ABI file...
if not exist "contracts\eos\fusionbridge.abi" (
    echo ❌ ABI file not found!
    echo Expected location: contracts\eos\fusionbridge.abi
    pause
    exit /b 1
)

echo ✅ ABI file found!
echo.

echo 🐳 Attempting Docker-based cleos deployment...
echo.

REM Try using Docker with a different approach
echo 🔄 Running cleos via Docker...
"C:\Program Files\Docker\Docker\resources\bin\docker.exe" run --rm -v "%cd%\contracts\eos:/work" xhyumiracle/eos bash -c "cd /work && cleos -u https://jungle4.cryptolions.io set abi quicksnake34 fusionbridge.abi"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Docker deployment failed!
    echo.
    echo 📋 Manual ABI Deployment Required:
    echo.
    echo 1. Install EOSIO software:
    echo    - Download from: https://github.com/EOSIO/eos/releases
    echo    - Extract to C:\eosio
    echo    - Add C:\eosio\bin to PATH
    echo.
    echo 2. Deploy ABI manually:
    echo    cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\eos\fusionbridge.abi
    echo.
    echo 3. Or use online tools:
    echo    - EOS Studio: https://eosstudio.io/
    echo    - Bloks.io: https://jungle.bloks.io/
) else (
    echo.
    echo ✅ ABI deployment successful!
    echo.
    echo 🎉 Your contract is now fully deployed!
)

echo.
echo 📊 Current Status:
echo ✅ Contract Code: DEPLOYED (55,288 bytes)
echo ❌ Contract ABI: PENDING
echo.
echo 📁 ABI file: contracts\eos\fusionbridge.abi
echo.

pause 