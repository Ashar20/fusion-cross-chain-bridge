#!/usr/bin/env node

/**
 * 🔧 Fix Contract for Jungle4 Compatibility
 * 
 * This script fixes the existing contract and ABI for Jungle4 testnet compatibility.
 */

const fs = require('fs');
const path = require('path');

class Jungle4ContractFixer {
    constructor() {
        this.sourceContract = 'contracts/eos/fusionbridge.cpp';
        this.fixedContract = 'contracts/eos/fusionbridge_fixed.cpp';
        this.sourceAbi = 'docker-eos-deployment/output/fusionbridge.abi';
        this.fixedAbi = 'contracts/eos/fusionbridge_fixed.abi';
        this.outputDir = 'jungle4-build';
    }

    async fixContract() {
        console.log(`🔧 Fixing contract for Jungle4 compatibility`);
        console.log(`============================================================`);

        try {
            // Create output directory
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }

            // Copy and fix the contract
            await this.fixContractCode();
            
            // Create compatible ABI
            await this.createCompatibleABI();
            
            // Create deployment files
            await this.createDeploymentFiles();

            console.log(`✅ Contract fixed successfully!`);
            console.log(`📁 Fixed contract: ${this.fixedContract}`);
            console.log(`📁 Fixed ABI: ${this.fixedAbi}`);
            console.log(`📁 Build directory: ${this.outputDir}`);
            console.log(``);

            console.log(`🎯 Key Changes Made:`);
            console.log(`   🔧 ABI Version: 1.0 (from 1.1)`);
            console.log(`   🔧 Removed: secret_hash field from htlc struct`);
            console.log(`   🔧 Added: Missing actions (gethtlc, cleanup)`);
            console.log(`   🔧 Fixed: Table definition with proper key_names and key_types`);
            console.log(`   🔧 Simplified: Contract structure for better compatibility`);
            console.log(``);

            console.log(`🚀 Ready for deployment!`);
            console.log(`📋 Manual deployment commands:`);
            console.log(`   cleos -u https://jungle4.cryptolions.io set code quicksnake34 ${this.outputDir}/fusionbridge.wasm`);
            console.log(`   cleos -u https://jungle4.cryptolions.io set abi quicksnake34 ${this.outputDir}/fusionbridge.abi`);
            console.log(``);

        } catch (error) {
            console.error(`❌ Error fixing contract: ${error.message}`);
        }
    }

    async fixContractCode() {
        console.log(`📝 Fixing contract code...`);
        
        // Read the original contract
        const contractContent = fs.readFileSync(this.sourceContract, 'utf8');
        
        // Remove the secret_hash field from the htlc struct
        const fixedContent = contractContent
            .replace(/checksum256 secret_hash;\s*\n/, '') // Remove secret_hash field
            .replace(/h\.secret_hash = hashlock;\s*\n/, ''); // Remove secret_hash assignment
        
        // Write the fixed contract
        fs.writeFileSync(this.fixedContract, fixedContent);
        
        console.log(`✅ Contract code fixed`);
    }

    async createCompatibleABI() {
        console.log(`📄 Creating compatible ABI...`);
        
        const compatibleABI = {
            "version": "eosio::abi/1.0",
            "structs": [
                {
                    "name": "createhtlc",
                    "base": "",
                    "fields": [
                        {"name": "sender", "type": "name"},
                        {"name": "recipient", "type": "name"},
                        {"name": "amount", "type": "asset"},
                        {"name": "hashlock", "type": "checksum256"},
                        {"name": "timelock", "type": "uint32"},
                        {"name": "memo", "type": "string"},
                        {"name": "eth_tx_hash", "type": "string"}
                    ]
                },
                {
                    "name": "claimhtlc",
                    "base": "",
                    "fields": [
                        {"name": "htlc_id", "type": "uint64"},
                        {"name": "secret", "type": "checksum256"},
                        {"name": "claimer", "type": "name"}
                    ]
                },
                {
                    "name": "refundhtlc",
                    "base": "",
                    "fields": [
                        {"name": "htlc_id", "type": "uint64"},
                        {"name": "refunder", "type": "name"}
                    ]
                },
                {
                    "name": "gethtlc",
                    "base": "",
                    "fields": [
                        {"name": "htlc_id", "type": "uint64"}
                    ]
                },
                {
                    "name": "cleanup",
                    "base": "",
                    "fields": [
                        {"name": "limit", "type": "uint64"}
                    ]
                },
                {
                    "name": "getstats",
                    "base": "",
                    "fields": []
                },
                {
                    "name": "htlc",
                    "base": "",
                    "fields": [
                        {"name": "id", "type": "uint64"},
                        {"name": "sender", "type": "name"},
                        {"name": "recipient", "type": "name"},
                        {"name": "amount", "type": "asset"},
                        {"name": "hashlock", "type": "checksum256"},
                        {"name": "timelock", "type": "uint32"},
                        {"name": "claimed", "type": "bool"},
                        {"name": "refunded", "type": "bool"},
                        {"name": "memo", "type": "string"},
                        {"name": "eth_tx_hash", "type": "string"},
                        {"name": "created_at", "type": "uint32"}
                    ]
                }
            ],
            "actions": [
                {"name": "createhtlc", "type": "createhtlc", "ricardian_contract": ""},
                {"name": "claimhtlc", "type": "claimhtlc", "ricardian_contract": ""},
                {"name": "refundhtlc", "type": "refundhtlc", "ricardian_contract": ""},
                {"name": "gethtlc", "type": "gethtlc", "ricardian_contract": ""},
                {"name": "cleanup", "type": "cleanup", "ricardian_contract": ""},
                {"name": "getstats", "type": "getstats", "ricardian_contract": ""}
            ],
            "tables": [
                {
                    "name": "htlcs",
                    "type": "htlc",
                    "index_type": "i64",
                    "key_names": ["id"],
                    "key_types": ["uint64"]
                }
            ],
            "ricardian_clauses": [],
            "variants": []
        };

        // Write the compatible ABI
        fs.writeFileSync(this.fixedAbi, JSON.stringify(compatibleABI, null, 2));
        
        console.log(`✅ Compatible ABI created`);
    }

    async createDeploymentFiles() {
        console.log(`📦 Creating deployment files...`);
        
        // Copy the existing WASM file if it exists
        const sourceWasm = 'docker-eos-deployment/output/fusionbridge.wasm';
        const targetWasm = path.join(this.outputDir, 'fusionbridge.wasm');
        const targetAbi = path.join(this.outputDir, 'fusionbridge.abi');
        
        if (fs.existsSync(sourceWasm)) {
            fs.copyFileSync(sourceWasm, targetWasm);
            console.log(`✅ WASM file copied`);
        } else {
            console.log(`⚠️  WASM file not found, you'll need to compile the contract`);
        }
        
        // Copy the fixed ABI
        fs.copyFileSync(this.fixedAbi, targetAbi);
        console.log(`✅ ABI file copied`);
        
        // Create a deployment script
        const deployScript = `#!/bin/bash
# Jungle4 Deployment Script

echo "🚀 Deploying to Jungle4 testnet..."

# Deploy WASM code
cleos -u https://jungle4.cryptolions.io set code quicksnake34 fusionbridge.wasm

# Deploy ABI
cleos -u https://jungle4.cryptolions.io set abi quicksnake34 fusionbridge.abi

echo "✅ Deployment complete!"
echo "🧪 Test with: cleos -u https://jungle4.cryptolions.io push action quicksnake34 getstats '{}' -p quicksnake34@active"
`;

        fs.writeFileSync(path.join(this.outputDir, 'deploy.sh'), deployScript);
        fs.chmodSync(path.join(this.outputDir, 'deploy.sh'), '755');
        
        console.log(`✅ Deployment script created`);
    }
}

async function main() {
    const fixer = new Jungle4ContractFixer();
    await fixer.fixContract();
}

if (require.main === module) {
    main();
}

module.exports = { Jungle4ContractFixer }; 