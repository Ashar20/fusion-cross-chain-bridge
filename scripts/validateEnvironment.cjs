#!/usr/bin/env node

/**
 * 🔍 Environment Validation Script
 * 
 * Validates that all required environment variables are properly configured
 * for the Fusion Cross-Chain Bridge project.
 */

require('dotenv').config();
const { ethers } = require('ethers');

class EnvironmentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validations = [];
    }

    log(message, type = 'info') {
        const emoji = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        console.log(`${emoji[type]} ${message}`);
    }

    addError(message) {
        this.errors.push(message);
        this.log(message, 'error');
    }

    addWarning(message) {
        this.warnings.push(message);
        this.log(message, 'warning');
    }

    addValidation(message) {
        this.validations.push(message);
        this.log(message, 'success');
    }

    validateRequired(key, description) {
        const value = process.env[key];
        if (!value || value === 'your_key_here' || value === 'your_private_key_here') {
            this.addError(`Missing required variable: ${key} (${description})`);
            return false;
        }
        this.addValidation(`${key}: ${description}`);
        return true;
    }

    validateOptional(key, description) {
        const value = process.env[key];
        if (!value || value.includes('your_') || value.includes('YOUR_')) {
            this.addWarning(`Optional variable not set: ${key} (${description})`);
            return false;
        }
        this.addValidation(`${key}: ${description}`);
        return true;
    }

    validatePrivateKey(key) {
        const value = process.env[key];
        if (!value) {
            this.addError(`Missing private key: ${key}`);
            return false;
        }

        // Remove 0x prefix if present
        const cleanKey = value.startsWith('0x') ? value.slice(2) : value;
        
        if (cleanKey.length !== 64) {
            this.addError(`Invalid private key length for ${key}: expected 64 characters, got ${cleanKey.length}`);
            return false;
        }

        if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
            this.addError(`Invalid private key format for ${key}: must be hexadecimal`);
            return false;
        }

        try {
            const wallet = new ethers.Wallet(cleanKey);
            this.addValidation(`${key}: Valid private key (address: ${wallet.address})`);
            return true;
        } catch (error) {
            this.addError(`Invalid private key for ${key}: ${error.message}`);
            return false;
        }
    }

    validateRpcUrl(key, description) {
        const value = process.env[key];
        if (!value) {
            this.addError(`Missing RPC URL: ${key}`);
            return false;
        }

        if (!value.startsWith('http')) {
            this.addError(`Invalid RPC URL format for ${key}: must start with http/https`);
            return false;
        }

        this.addValidation(`${key}: ${description} (${value})`);
        return true;
    }

    async testEthereumConnection() {
        try {
            this.log('Testing Ethereum connection...', 'info');
            
            const rpcUrl = process.env.ETH_RPC_URL || process.env.RPC_URL;
            if (!rpcUrl) {
                this.addError('No Ethereum RPC URL configured');
                return false;
            }

            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const network = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();
            
            this.addValidation(`Ethereum connection successful: ${network.name} (${Number(network.chainId)}) - Block ${blockNumber}`);
            
            // Test wallet if private key is available
            const privateKey = process.env.PRIVATE_KEY;
            if (privateKey) {
                const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
                const wallet = new ethers.Wallet(cleanKey, provider);
                const balance = await provider.getBalance(wallet.address);
                
                this.addValidation(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
                
                if (balance === 0n) {
                    this.addWarning('Wallet has zero balance - you may need testnet ETH');
                }
            }
            
            return true;
        } catch (error) {
            this.addError(`Ethereum connection failed: ${error.message}`);
            return false;
        }
    }

    async testAlgorandConnection() {
        try {
            this.log('Testing Algorand connection...', 'info');
            
            const rpcUrl = process.env.ALGORAND_RPC_URL;
            if (!rpcUrl) {
                this.addError('No Algorand RPC URL configured');
                return false;
            }

            // Simple HTTP test to Algorand node
            const response = await fetch(`${rpcUrl}/health`);
            if (response.ok) {
                this.addValidation(`Algorand connection successful: ${rpcUrl}`);
                return true;
            } else {
                this.addWarning(`Algorand health check returned status: ${response.status}`);
                return false;
            }
        } catch (error) {
            this.addError(`Algorand connection failed: ${error.message}`);
            return false;
        }
    }

    async test1inchAPI() {
        try {
            this.log('Testing 1inch API connection...', 'info');
            
            const apiKey = process.env.ONEINCH_API_KEY;
            if (!apiKey || apiKey.includes('your_')) {
                this.addWarning('1inch API key not configured - some features may not work');
                return false;
            }

            // Test API connection (basic ping)
            const baseUrl = process.env.ONEINCH_API_BASE_URL || 'https://api.1inch.dev';
            const response = await fetch(`${baseUrl}/healthcheck`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'accept': 'application/json'
                }
            });

            if (response.ok) {
                this.addValidation('1inch API connection successful');
                return true;
            } else {
                this.addWarning(`1inch API returned status: ${response.status}`);
                return false;
            }
        } catch (error) {
            this.addWarning(`1inch API test failed: ${error.message}`);
            return false;
        }
    }

    async validate() {
        console.log('🌉 Fusion Cross-Chain Bridge - Environment Validation');
        console.log('='.repeat(60));
        console.log('');

        // Required variables
        this.log('📋 Validating required variables...', 'info');
        this.validateRequired('ONEINCH_API_KEY', '1inch API Key');
        this.validatePrivateKey('PRIVATE_KEY');
        this.validateRpcUrl('ETH_RPC_URL', 'Ethereum RPC URL');
        this.validateRpcUrl('ALGORAND_RPC_URL', 'Algorand RPC URL');

        // Optional but recommended variables
        this.log('\\n📋 Validating optional variables...', 'info');
        this.validateOptional('ETHERSCAN_API_KEY', 'Etherscan API for contract verification');
        this.validateOptional('ALGORAND_PRIVATE_KEY', 'Algorand private key');
        this.validateOptional('RELAYER_PRIVATE_KEY', 'Relayer private key');

        // Configuration validation
        this.log('\\n📋 Validating configuration...', 'info');
        const chainId = process.env.ETH_CHAIN_ID;
        if (chainId && chainId !== '11155111') {
            this.addWarning(`Chain ID is ${chainId}, expected 11155111 for Sepolia testnet`);
        } else if (chainId) {
            this.addValidation('Chain ID: Sepolia testnet (11155111)');
        }

        // Network connectivity tests
        this.log('\\n🌐 Testing network connectivity...', 'info');
        await this.testEthereumConnection();
        await this.testAlgorandConnection();
        await this.test1inchAPI();

        // Summary
        this.log('\\n📊 Validation Summary', 'info');
        console.log('='.repeat(60));
        
        if (this.validations.length > 0) {
            this.log(`✅ ${this.validations.length} validations passed`, 'success');
        }
        
        if (this.warnings.length > 0) {
            this.log(`⚠️  ${this.warnings.length} warnings found`, 'warning');
        }
        
        if (this.errors.length > 0) {
            this.log(`❌ ${this.errors.length} errors found`, 'error');
            console.log('\\n🔧 To fix errors:');
            console.log('1. Check your .env file');
            console.log('2. Ensure all required variables are set');
            console.log('3. Verify private keys are valid');
            console.log('4. Test network connectivity');
            console.log('\\n📋 See ENVIRONMENT_SETUP.md for detailed instructions');
            return false;
        }

        this.log('\\n🎉 Environment validation completed successfully!', 'success');
        this.log('Your Fusion Cross-Chain Bridge is ready to deploy and run.', 'success');
        
        console.log('\\n🚀 Next steps:');
        console.log('1. npm run deploy-algorand-htlc-bridge');
        console.log('2. npm run deploy-algorand-contract');
        console.log('3. npm run start-algorand-relayer');
        console.log('4. npm run test-bidirectional-htlc');
        
        return true;
    }
}

async function main() {
    const validator = new EnvironmentValidator();
    const isValid = await validator.validate();
    process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { EnvironmentValidator };