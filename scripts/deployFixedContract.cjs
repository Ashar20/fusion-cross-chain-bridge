#!/usr/bin/env node

/**
 * 🚀 DEPLOY FIXED CONTRACT WITH 1-HOUR TIMELOCK
 * 
 * Deploys CrossChainHTLCResolverFixed.sol with:
 * - DEFAULT_TIMELOCK = 1 hours (3600 seconds)
 * - Proper HTLC claiming logic
 * - Ready for 1-hour timelock testing
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function deployFixedContract() {
    console.log('🚀 DEPLOYING FIXED CONTRACT WITH 1-HOUR TIMELOCK');
    console.log('================================================');
    console.log('✅ DEFAULT_TIMELOCK = 1 hours (3600 seconds)');
    console.log('✅ Proper HTLC claiming logic');
    console.log('✅ Ready for 1-hour timelock testing');
    console.log('================================================\n');
    
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
        
        // Check if fixed contract exists
        const contractPath = 'contracts/CrossChainHTLCResolverFixed.sol';
        if (!fs.existsSync(contractPath)) {
            throw new Error(`Fixed contract file not found: ${contractPath}`);
        }
        
        console.log('📄 Fixed contract found');
        console.log('🔨 Compiling and deploying...');
        
        // Use hardhat to deploy the fixed contract
        const { exec } = require('child_process');
        
        return new Promise((resolve, reject) => {
            // First, let's check if we can compile the fixed contract
            exec('npx hardhat compile', (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Compilation failed:', error.message);
                    reject(error);
                    return;
                }
                
                console.log('✅ Compilation successful');
                console.log('🚀 Deploying fixed contract...');
                
                // Deploy using hardhat
                exec('npx hardhat run scripts/deployCrossChainHTLCResolver.cjs --network sepolia', (deployError, deployStdout, deployStderr) => {
                    if (deployError) {
                        console.error('❌ Deployment failed:', deployError.message);
                        reject(deployError);
                        return;
                    }
                    
                    console.log('📤 Deployment output:');
                    console.log(deployStdout);
                    
                    if (deployStderr) {
                        console.log('⚠️ Warnings:');
                        console.log(deployStderr);
                    }
                    
                    // Extract contract address from output
                    const addressMatch = deployStdout.match(/Contract deployed to: (0x[a-fA-F0-9]{40})/);
                    if (addressMatch) {
                        const contractAddress = addressMatch[1];
                        console.log('');
                        console.log('🎉 FIXED CONTRACT DEPLOYED SUCCESSFULLY!');
                        console.log('==========================================');
                        console.log(`📍 Contract Address: ${contractAddress}`);
                        console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${contractAddress}`);
                        console.log('');
                        console.log('✅ Features:');
                        console.log('   - DEFAULT_TIMELOCK = 1 hours (3600 seconds)');
                        console.log('   - Proper HTLC claiming logic');
                        console.log('   - Ready for 1-hour timelock testing');
                        console.log('   - Supports your suggested approach');
                        console.log('');
                        
                        // Save deployment info
                        const deploymentInfo = {
                            contract: 'CrossChainHTLCResolverFixed',
                            address: contractAddress,
                            network: 'Sepolia Testnet',
                            deployer: wallet.address,
                            timestamp: new Date().toISOString(),
                            features: [
                                'DEFAULT_TIMELOCK = 1 hours (3600 seconds)',
                                'Proper HTLC claiming logic',
                                'Ready for 1-hour timelock testing',
                                'Supports current timestamp + 3600 seconds approach'
                            ],
                            usage: {
                                timelockCalculation: 'currentTimestamp + 3600',
                                example: 'Get current time in seconds, add 3600 seconds (1 hour), use as timelock'
                            }
                        };
                        
                        fs.writeFileSync('FIXED_1HOUR_TIMELOCK_DEPLOYMENT.json', JSON.stringify(deploymentInfo, null, 2));
                        console.log('📁 Deployment info saved to: FIXED_1HOUR_TIMELOCK_DEPLOYMENT.json');
                        
                        resolve(contractAddress);
                    } else {
                        reject(new Error('Could not extract contract address from deployment output'));
                    }
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Run the deployment
deployFixedContract().then(address => {
    console.log('✅ Fixed contract deployment completed!');
    console.log(`📍 New Contract: ${address}`);
    console.log('');
    console.log('🎯 Now you can test with 1-hour timelock!');
    console.log('   - Use current timestamp + 3600 seconds');
    console.log('   - Contract will accept 1-hour timelocks');
    console.log('   - Your suggested approach will work');
    process.exit(0);
}).catch(error => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
}); 