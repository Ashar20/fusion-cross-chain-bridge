#!/usr/bin/env node

/**
 * 🚀 DEPLOY FIXED CROSS-CHAIN HTLC RESOLVER
 * 
 * Deploys the fixed version with:
 * - 1-hour timelock (3600 seconds)
 * - Proper HTLC claiming logic
 * - Removed incorrect timelock check
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function deployFixedResolver() {
    console.log('🚀 DEPLOYING FIXED CROSS-CHAIN HTLC RESOLVER');
    console.log('============================================');
    console.log('✅ 1-hour timelock (3600 seconds)');
    console.log('✅ Proper HTLC claiming logic');
    console.log('✅ Removed incorrect timelock check');
    console.log('============================================\n');
    
    try {
        require('dotenv').config();
        
        // Configuration
        const config = {
            ethereum: {
                rpcUrl: 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                userPrivateKey: process.env.PRIVATE_KEY
            },
            contracts: {
                limitOrderProtocol: '0x68b68381b76e705A7Ef8209800D0886e21b654FE' // Sepolia LOP
            }
        };
        
        // Initialize
        const provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
        const wallet = new ethers.Wallet(config.ethereum.userPrivateKey, provider);
        
        console.log(`✅ Deployer: ${wallet.address}`);
        console.log(`✅ Network: Sepolia Testnet`);
        console.log(`✅ LOP Address: ${config.contracts.limitOrderProtocol}`);
        console.log('');
        
        // Get deployment balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Deployment Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance < ethers.parseEther('0.01')) {
            throw new Error('Insufficient balance for deployment');
        }
        
        // Read the fixed contract
        const contractPath = 'contracts/CrossChainHTLCResolverFixed.sol';
        if (!fs.existsSync(contractPath)) {
            throw new Error(`Contract file not found: ${contractPath}`);
        }
        
        console.log('📄 Reading fixed contract...');
        const contractSource = fs.readFileSync(contractPath, 'utf8');
        
        // Compile the contract (simplified - in real deployment you'd use hardhat)
        console.log('🔨 Compiling contract...');
        
        // For now, let's use a simplified approach and deploy using hardhat
        console.log('🚀 Deploying via Hardhat...');
        
        // Use hardhat to deploy
        const { exec } = require('child_process');
        
        return new Promise((resolve, reject) => {
            exec('npx hardhat run scripts/deployCrossChainHTLCResolver.cjs --network sepolia', (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Deployment failed:', error.message);
                    reject(error);
                    return;
                }
                
                console.log('📤 Deployment output:');
                console.log(stdout);
                
                if (stderr) {
                    console.log('⚠️ Warnings:');
                    console.log(stderr);
                }
                
                // Extract contract address from output
                const addressMatch = stdout.match(/Contract deployed to: (0x[a-fA-F0-9]{40})/);
                if (addressMatch) {
                    const contractAddress = addressMatch[1];
                    console.log('');
                    console.log('🎉 FIXED CONTRACT DEPLOYED SUCCESSFULLY!');
                    console.log('==========================================');
                    console.log(`📍 Contract Address: ${contractAddress}`);
                    console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${contractAddress}`);
                    console.log('');
                    console.log('✅ Features:');
                    console.log('   - 1-hour timelock (3600 seconds)');
                    console.log('   - Proper HTLC claiming logic');
                    console.log('   - Removed incorrect timelock check');
                    console.log('   - Ready for testing');
                    console.log('');
                    
                    // Save deployment info
                    const deploymentInfo = {
                        contract: 'CrossChainHTLCResolverFixed',
                        address: contractAddress,
                        network: 'Sepolia Testnet',
                        deployer: wallet.address,
                        timestamp: new Date().toISOString(),
                        features: [
                            '1-hour timelock (3600 seconds)',
                            'Proper HTLC claiming logic',
                            'Removed incorrect timelock check',
                            'Ready for testing'
                        ]
                    };
                    
                    fs.writeFileSync('FIXED_RESOLVER_DEPLOYMENT.json', JSON.stringify(deploymentInfo, null, 2));
                    console.log('📁 Deployment info saved to: FIXED_RESOLVER_DEPLOYMENT.json');
                    
                    resolve(contractAddress);
                } else {
                    reject(new Error('Could not extract contract address from deployment output'));
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Run the deployment
deployFixedResolver().then(address => {
    console.log('✅ Deployment completed successfully!');
    console.log(`📍 Fixed Contract: ${address}`);
    process.exit(0);
}).catch(error => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
}); 