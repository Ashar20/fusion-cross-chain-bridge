#!/usr/bin/env node

/**
 * 🚀 Deploy SimpleHTLC Contract
 * 
 * Deploys your existing SimpleHTLC contract on Sepolia testnet
 */

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

class SimpleHTLCDeployer {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractPath = path.join(__dirname, '../contracts/SimpleHTLC.sol');
    }

    async compileContract() {
        console.log('🔨 Compiling SimpleHTLC contract...');
        
        try {
            const contractSource = fs.readFileSync(this.contractPath, 'utf8');
            
            const input = {
                language: 'Solidity',
                sources: {
                    'SimpleHTLC.sol': {
                        content: contractSource
                    }
                },
                settings: {
                    outputSelection: {
                        '*': {
                            '*': ['abi', 'evm.bytecode']
                        }
                    }
                }
            };

            const output = JSON.parse(solc.compile(JSON.stringify(input)));
            
            if (output.errors) {
                for (const error of output.errors) {
                    if (error.severity === 'error') {
                        throw new Error(`Compilation error: ${error.message}`);
                    }
                    console.warn(`Warning: ${error.message}`);
                }
            }

            const contract = output.contracts['SimpleHTLC.sol']['SimpleHTLC'];
            this.abi = contract.abi;
            this.bytecode = contract.evm.bytecode.object;
            
            console.log('✅ Contract compiled successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Compilation failed:', error.message);
            return false;
        }
    }

    async deploy() {
        console.log('🚀 Deploying SimpleHTLC Contract...');
        console.log('='.repeat(60));
        
        try {
            // Check network and balance
            const network = await this.provider.getNetwork();
            const balance = await this.provider.getBalance(this.wallet.address);
            
            console.log(`📋 Network: ${network.name} (${Number(network.chainId)})`);
            console.log(`👤 Deployer: ${this.wallet.address}`);
            console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
            
            if (balance < ethers.parseEther("0.005")) {
                throw new Error("Insufficient ETH balance for deployment");
            }

            // Compile contract
            const compiled = await this.compileContract();
            if (!compiled) {
                throw new Error("Contract compilation failed");
            }

            // Create contract factory
            const contractFactory = new ethers.ContractFactory(
                this.abi,
                this.bytecode,
                this.wallet
            );
            
            console.log('📡 Deploying contract...');
            
            // Deploy with lower gas settings
            const contract = await contractFactory.deploy({
                gasLimit: 2000000,
                gasPrice: ethers.parseUnits("5", "gwei")
            });
            
            console.log(`📋 Transaction hash: ${contract.deploymentTransaction().hash}`);
            console.log('⏳ Waiting for deployment confirmation...');
            
            // Wait for deployment
            await contract.waitForDeployment();
            const contractAddress = await contract.getAddress();
            
            console.log('✅ SimpleHTLC Contract deployed successfully!');
            console.log(`📋 Contract address: ${contractAddress}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
            
            // Save deployment info
            const deploymentInfo = {
                contractName: 'SimpleHTLC',
                contractAddress: contractAddress,
                transactionHash: contract.deploymentTransaction().hash,
                network: network.name,
                chainId: Number(network.chainId),
                deployer: this.wallet.address,
                deployedAt: new Date().toISOString(),
                abi: this.abi
            };
            
            const deploymentPath = path.join(__dirname, '../simple-htlc-deployment.json');
            fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
            
            console.log(`📁 Deployment info saved to: ${deploymentPath}`);
            
            // Test basic contract functionality
            await this.testContract(contract);
            
            return {
                success: true,
                contractAddress: contractAddress,
                transactionHash: contract.deploymentTransaction().hash,
                contract: contract
            };
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testContract(contract) {
        console.log('\n🧪 Testing deployed contract...');
        
        try {
            // Test owner
            const owner = await contract.owner();
            console.log(`👤 Contract owner: ${owner}`);
            
            // Test 1inch addresses
            const [settlement, router] = await contract.getOfficial1inchContracts();
            console.log(`🔗 1inch Settlement: ${settlement}`);
            console.log(`🔗 1inch Router V5: ${router}`);
            
            // Test resolver authorization
            const isAuthorized = await contract.isResolverAuthorized(this.wallet.address);
            console.log(`🔐 Deployer authorized: ${isAuthorized}`);
            
            console.log('✅ Contract tests passed');
            
        } catch (error) {
            console.error('❌ Contract test failed:', error.message);
        }
    }
}

async function main() {
    const deployer = new SimpleHTLCDeployer();
    await deployer.deploy();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { SimpleHTLCDeployer };