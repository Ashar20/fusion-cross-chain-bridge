#!/usr/bin/env node

/**
 * 🎯 SIMPLE LOP ORDER CREATION
 * 
 * Creates a signed LOP order without relying on contract calls
 * Saves the order to file for the relayer to process
 */

const { ethers } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');

// Load environment configurations
require('dotenv').config({ path: '.env.relayer' });

class SimpleLOPOrderCreator {
    constructor() {
        console.log('🎯 SIMPLE LOP ORDER CREATION');
        console.log('=============================');
        console.log('✅ Local order hash generation');
        console.log('✅ EIP-712 signing');
        console.log('✅ File-based order storage');
        console.log('✅ Relayer-ready format');
        console.log('=============================\n');
        
        this.initialize();
    }
    
    async initialize() {
        // Initialize provider and wallet
        this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        this.ethWallet = new ethers.Wallet(process.env.RELAYER_ETH_PRIVATE_KEY, this.provider);
        
        // Configuration
        this.config = {
            lopAddress: '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
            usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            intent: {
                ethAmount: ethers.parseEther('0.001'), // 0.001 ETH
                usdcAmount: ethers.parseUnits('1.6', 6), // 1.6 USDC (proxy for 1 ALGO)
                deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                salt: ethers.getBigInt('0x' + crypto.randomBytes(32).toString('hex'))
            }
        };
        
        console.log('✅ Simple LOP Order Creator initialized');
        console.log(`📱 Maker Address: ${this.ethWallet.address}`);
        console.log(`🏦 LOP Contract: ${this.config.lopAddress}`);
        console.log(`💰 Intent: ${ethers.formatEther(this.config.intent.ethAmount)} ETH → ${ethers.formatUnits(this.config.intent.usdcAmount, 6)} USDC`);
    }
    
    async checkBalances() {
        console.log('💰 CHECKING BALANCES');
        console.log('====================');
        
        try {
            const ethBalance = await this.provider.getBalance(this.ethWallet.address);
            console.log(`📱 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
            
            if (ethBalance < this.config.intent.ethAmount) {
                throw new Error(`Insufficient ETH balance. Need ${ethers.formatEther(this.config.intent.ethAmount)} ETH`);
            }
            
            console.log('✅ Sufficient ETH balance for order creation');
            
        } catch (error) {
            console.log(`❌ Error checking balances: ${error.message}`);
            throw error;
        }
    }
    
    generateOrderHash(order) {
        console.log('🔐 GENERATING ORDER HASH');
        console.log('=========================');
        
        try {
            // Create the order hash using keccak256
            const orderData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                [
                    order.maker,
                    order.makerAsset,
                    order.takerAsset,
                    order.makerAmount,
                    order.takerAmount,
                    order.salt,
                    order.deadline
                ]
            );
            
            const orderHash = ethers.keccak256(orderData);
            
            console.log('✅ Order hash generated locally');
            console.log(`   Order Hash: ${orderHash}`);
            
            return orderHash;
            
        } catch (error) {
            console.log(`❌ Error generating order hash: ${error.message}`);
            throw error;
        }
    }
    
    async signOrder(order) {
        console.log('✍️ SIGNING ORDER WITH EIP-712');
        console.log('=============================');
        
        try {
            // EIP-712 domain
            const domain = {
                name: '1inch Limit Order Protocol',
                version: '2',
                chainId: 11155111, // Sepolia
                verifyingContract: this.config.lopAddress
            };
            
            // EIP-712 types
            const types = {
                Order: [
                    { name: 'maker', type: 'address' },
                    { name: 'makerAsset', type: 'address' },
                    { name: 'takerAsset', type: 'address' },
                    { name: 'makerAmount', type: 'uint256' },
                    { name: 'takerAmount', type: 'uint256' },
                    { name: 'salt', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };
            
            // EIP-712 value
            const value = {
                maker: order.maker,
                makerAsset: order.makerAsset,
                takerAsset: order.takerAsset,
                makerAmount: order.makerAmount,
                takerAmount: order.takerAmount,
                salt: order.salt,
                deadline: order.deadline
            };
            
            // Sign the order
            const signature = await this.ethWallet.signTypedData(domain, types, value);
            
            console.log('✅ Order signed with EIP-712');
            console.log(`   Signature: ${signature}`);
            
            return signature;
            
        } catch (error) {
            console.log(`❌ Error signing order: ${error.message}`);
            throw error;
        }
    }
    
    async createAndSaveOrder() {
        console.log('📝 CREATING AND SAVING ORDER');
        console.log('============================');
        
        try {
            // Create order object
            const order = {
                maker: this.ethWallet.address,
                makerAsset: ethers.ZeroAddress, // ETH
                takerAsset: this.config.usdcAddress, // USDC
                makerAmount: this.config.intent.ethAmount,
                takerAmount: this.config.intent.usdcAmount,
                salt: this.config.intent.salt,
                deadline: this.config.intent.deadline,
                signature: '0x' // Will be filled after signing
            };
            
            // Generate order hash
            const orderHash = this.generateOrderHash(order);
            order.orderHash = orderHash;
            
            // Sign the order
            const signature = await this.signOrder(order);
            order.signature = signature;
            
            // Create complete order data with stringified BigInts
            const orderData = {
                maker: order.maker,
                makerAsset: order.makerAsset,
                takerAsset: order.takerAsset,
                makerAmount: order.makerAmount.toString(),
                takerAmount: order.takerAmount.toString(),
                salt: order.salt.toString(),
                deadline: order.deadline.toString(),
                signature: order.signature,
                orderHash: order.orderHash,
                intent: {
                    ethAmount: this.config.intent.ethAmount.toString(),
                    usdcAmount: this.config.intent.usdcAmount.toString(),
                    deadline: this.config.intent.deadline.toString(),
                    salt: this.config.intent.salt.toString()
                },
                metadata: {
                    createdAt: new Date().toISOString(),
                    network: 'Sepolia',
                    description: 'ETH to USDC limit order (proxy for ALGO)',
                    makerAddress: this.ethWallet.address,
                    relayerTarget: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
                    orderType: 'LIMIT_ORDER',
                    version: '1.0'
                }
            };
            
            // Save to file
            fs.writeFileSync('SIGNED_LOP_ORDER.json', JSON.stringify(orderData, null, 2));
            
            console.log('✅ Order saved to SIGNED_LOP_ORDER.json');
            console.log('\n📋 ORDER DETAILS:');
            console.log(`   Maker: ${order.maker}`);
            console.log(`   Maker Asset: ${order.makerAsset} (ETH)`);
            console.log(`   Taker Asset: ${order.takerAsset} (USDC)`);
            console.log(`   Maker Amount: ${ethers.formatEther(order.makerAmount)} ETH`);
            console.log(`   Taker Amount: ${ethers.formatUnits(order.takerAmount, 6)} USDC`);
            console.log(`   Salt: ${order.salt.toString(16)}`);
            console.log(`   Deadline: ${new Date(parseInt(order.deadline) * 1000).toISOString()}`);
            console.log(`   Order Hash: ${orderHash}`);
            console.log(`   Signature: ${signature.substring(0, 66)}...`);
            
            return orderData;
            
        } catch (error) {
            console.log(`❌ Error creating order: ${error.message}`);
            throw error;
        }
    }
    
    async runOrderCreation() {
        try {
            console.log('🚀 STARTING ORDER CREATION PROCESS');
            console.log('==================================\n');
            
            // Check balances
            await this.checkBalances();
            
            // Create and save order
            const orderData = await this.createAndSaveOrder();
            
            console.log('\n🎉 ORDER CREATION COMPLETED!');
            console.log('=============================');
            console.log('✅ Order created successfully');
            console.log('✅ Order signed with EIP-712');
            console.log('✅ Order saved to file');
            console.log('✅ Ready for relayer processing');
            
            console.log('\n🚀 NEXT STEPS:');
            console.log('1. Start the enhanced relayer');
            console.log('2. Relayer will detect the order file');
            console.log('3. Relayer will analyze profitability');
            console.log('4. Relayer will execute partial fill');
            console.log('5. Monitor execution and profits');
            
            return orderData;
            
        } catch (error) {
            console.log('\n❌ ORDER CREATION FAILED');
            console.log('=======================');
            console.log(`Error: ${error.message}`);
            throw error;
        }
    }
}

// Run the order creation
async function main() {
    const creator = new SimpleLOPOrderCreator();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for initialization
    
    const orderData = await creator.runOrderCreation();
    
    console.log('\n🌟 Order is ready for relayer testing!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { SimpleLOPOrderCreator }; 