@echo off
echo 🚀 Compiling EOS Contract for Windows...
cd contracts\eos

echo 📦 Compiling fusionbridge.cpp...
eosio-cpp -o fusionbridge.wasm fusionbridge.cpp

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Compilation failed!
    pause
    exit /b 1
)

echo 📋 Generating ABI...
eosio-abigen fusionbridge.cpp --output=fusionbridge.abi

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ABI generation failed!
    pause
    exit /b 1
)

echo ✅ Compilation successful!
echo 📁 Files created:
echo   - fusionbridge.wasm
echo   - fusionbridge.abi
pause
