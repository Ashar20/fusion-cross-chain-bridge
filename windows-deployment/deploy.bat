@echo off
echo 🚀 Deploying EOS Contract to Jungle4...

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

echo 🔗 Deploying contract...
cleos -u https://jungle4.cryptolions.io set contract quicksnake34 contracts\eos fusionbridge.wasm fusionbridge.abi

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed!
    echo 💡 Try using online tools instead:
    echo   - EOS Studio: http://app.eosstudio.io/guest
    echo   - Bloks.io: https://local.bloks.io/
    pause
    exit /b 1
)

echo ✅ Deployment successful!
pause
