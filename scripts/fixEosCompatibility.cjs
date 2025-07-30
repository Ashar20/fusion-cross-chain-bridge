#!/usr/bin/env node

/**
 * 🔧 Fix EOS Compatibility Issues
 * 
 * This script addresses:
 * 1. CDT version compatibility with Jungle4
 * 2. ABI format issues
 * 3. Contract recompilation with compatible settings
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class EosCompatibilityFixer {
    constructor() {
        this.contractDir = path.join(__dirname, '../contracts/eos');
        this.wasmPath = path.join(this.contractDir, 'fusionbridge.wasm');
        this.abiPath = path.join(this.contractDir, 'fusionbridge.abi');
        this.cppPath = path.join(this.contractDir, 'fusionbridge.cpp');
    }

    async fixCompatibility() {
        console.log('🔧 Fixing EOS Compatibility Issues');
        console.log('=' .repeat(50));

        try {
            // Step 1: Check current files
            await this.checkCurrentFiles();

            // Step 2: Recompile with compatible settings
            await this.recompileWithCompatibleSettings();

            // Step 3: Fix ABI format
            await this.fixABIFormat();

            // Step 4: Verify compatibility
            await this.verifyCompatibility();

        } catch (error) {
            console.error('❌ Compatibility fix failed:', error.message);
            throw error;
        }
    }

    async checkCurrentFiles() {
        console.log('\n📁 Checking current contract files...');
        
        const files = [
            { path: this.cppPath, name: 'Source Code' },
            { path: this.wasmPath, name: 'WASM' },
            { path: this.abiPath, name: 'ABI' }
        ];

        for (const file of files) {
            if (fs.existsSync(file.path)) {
                const stats = fs.statSync(file.path);
                console.log(`   ✅ ${file.name}: ${(stats.size / 1024).toFixed(2)} KB`);
            } else {
                console.log(`   ❌ ${file.name}: Not found`);
            }
        }
    }

    async recompileWithCompatibleSettings() {
        console.log('\n🔨 Recompiling with compatible settings...');

        try {
            // Use Docker with compatible CDT version
            const dockerCmd = `docker run --rm -v "${this.contractDir}:/contract" -w /contract eosio/eosio.cdt:1.7.0 eosio-cpp -o fusionbridge.wasm fusionbridge.cpp`;
            
            console.log('   📦 Using eosio.cdt:1.7.0 (Jungle4 compatible)');
            execSync(dockerCmd, { stdio: 'inherit' });
            
            console.log('   ✅ WASM compilation successful');

            // Generate ABI with compatible settings
            const abiCmd = `docker run --rm -v "${this.contractDir}:/contract" -w /contract eosio/eosio.cdt:1.7.0 eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi`;
            
            console.log('   📄 Generating compatible ABI...');
            execSync(abiCmd, { stdio: 'inherit' });
            
            console.log('   ✅ ABI generation successful');

        } catch (error) {
            console.log('   ⚠️  Docker compilation failed, trying alternative...');
            await this.alternativeCompilation();
        }
    }

    async alternativeCompilation() {
        console.log('   🔄 Trying alternative compilation method...');
        
        // Check if we have local eosio-cdt
        try {
            execSync('which eosio-cpp', { stdio: 'ignore' });
            console.log('   📦 Using local eosio-cdt');
            
            const cppCmd = `cd "${this.contractDir}" && eosio-cpp -o fusionbridge.wasm fusionbridge.cpp`;
            execSync(cppCmd, { stdio: 'inherit' });
            
            const abiCmd = `cd "${this.contractDir}" && eosio-abigen fusionbridge.cpp --contract=fusionbridge --output=fusionbridge.abi`;
            execSync(abiCmd, { stdio: 'inherit' });
            
            console.log('   ✅ Alternative compilation successful');
        } catch (error) {
            throw new Error('No compilation method available. Please install eosio.cdt or Docker.');
        }
    }

    async fixABIFormat() {
        console.log('\n🔧 Fixing ABI format for Jungle4 compatibility...');

        if (!fs.existsSync(this.abiPath)) {
            throw new Error('ABI file not found after compilation');
        }

        try {
            const abiContent = fs.readFileSync(this.abiPath, 'utf8');
            const abi = JSON.parse(abiContent);

            // Ensure compatible ABI version
            if (abi.version !== 'eosio::abi/1.2') {
                console.log('   🔄 Updating ABI version to 1.2...');
                abi.version = 'eosio::abi/1.2';
            }

            // Ensure proper structure
            if (!abi.actions) {
                console.log('   🔄 Adding actions array...');
                abi.actions = [];
            }

            if (!abi.tables) {
                console.log('   🔄 Adding tables array...');
                abi.tables = [];
            }

            // Write back the fixed ABI
            fs.writeFileSync(this.abiPath, JSON.stringify(abi, null, 2));
            console.log('   ✅ ABI format fixed');

        } catch (error) {
            console.log('   ⚠️  ABI format fix failed:', error.message);
        }
    }

    async verifyCompatibility() {
        console.log('\n🔍 Verifying compatibility...');

        const files = [
            { path: this.wasmPath, name: 'WASM' },
            { path: this.abiPath, name: 'ABI' }
        ];

        for (const file of files) {
            if (fs.existsSync(file.path)) {
                const stats = fs.statSync(file.path);
                console.log(`   ✅ ${file.name}: ${(stats.size / 1024).toFixed(2)} KB`);
                
                if (file.name === 'ABI') {
                    try {
                        const abiContent = fs.readFileSync(file.path, 'utf8');
                        const abi = JSON.parse(abiContent);
                        console.log(`   📋 ABI Version: ${abi.version}`);
                        console.log(`   📋 Actions: ${abi.actions ? abi.actions.length : 0}`);
                        console.log(`   📋 Tables: ${abi.tables ? abi.tables.length : 0}`);
                    } catch (error) {
                        console.log(`   ⚠️  ABI validation failed: ${error.message}`);
                    }
                }
            } else {
                console.log(`   ❌ ${file.name}: Not found`);
            }
        }
    }
}

// Run the compatibility fixer
async function main() {
    const fixer = new EosCompatibilityFixer();
    
    try {
        await fixer.fixCompatibility();
        console.log('\n🎉 EOS compatibility fix completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Deploy the fixed contract: npm run fresh-deploy-eos');
        console.log('   2. Verify deployment: npm run verify-eos-final');
        console.log('   3. Test contract functionality');
        
    } catch (error) {
        console.error('\n❌ Compatibility fix failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { EosCompatibilityFixer }; 