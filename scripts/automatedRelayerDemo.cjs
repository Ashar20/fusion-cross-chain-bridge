#!/usr/bin/env node

/**
 * 🤖 AUTOMATED RELAYER DEMO
 * 
 * Creates orders and lets the running relayer handle everything automatically
 * Demonstrates the complete automated cross-chain workflow
 */

const { ethers } = require('ethers');
const fs = require('fs');

class AutomatedRelayerDemo {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.user = null;
        this.provider = null;
        this.orderCount = 0;
    }

    async initialize() {
        console.log('🤖 AUTOMATED RELAYER DEMO');
        console.log('==========================');
        console.log('✅ Working with running relayer');
        console.log('✅ Automated order creation');
        console.log('✅ Real-time monitoring');
        console.log('==========================\n');

        try {
            require('dotenv').config();
            
            // Load deployment info
            const deploymentInfo = JSON.parse(fs.readFileSync('./ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json', 'utf8'));
            this.contractAddress = deploymentInfo.contractAddress;
            
            // Initialize provider and user
            this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
            this.user = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            
            // Load contract
            const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
            const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            this.contract = new ethers.Contract(this.contractAddress, contractArtifact.abi, this.user);
            
            console.log('✅ System initialized');
            console.log(`📋 Contract: ${this.contractAddress}`);
            console.log(`👤 User: ${this.user.address}`);
            
            // Check user balance
            const balance = await this.provider.getBalance(this.user.address);
            console.log(`💰 User ETH Balance: ${ethers.formatEther(balance)} ETH`);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async createAutomatedOrder(orderNumber) {
        console.log(`\n📝 CREATING AUTOMATED ORDER #${orderNumber}`);
        console.log('=====================================');

        // Create LOP intent with varying amounts
        const baseAmount = 0.001; // 0.001 ETH base
        const variation = (orderNumber - 1) * 0.0005; // Vary by 0.0005 ETH each order
        const ethAmount = baseAmount + variation;
        const algoAmount = ethAmount * 1500; // 1 ETH = 1500 ALGO

        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO
            makerAmount: ethers.parseEther(ethAmount.toString()),
            takerAmount: ethers.parseEther(algoAmount.toString()),
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther((ethAmount * 0.2).toString())
        };
        
        // Generate secret and hashlock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        // Create EIP-712 signature
        const signature = await this.createEIP712Signature(intent);
        
        console.log('📋 ORDER DETAILS:');
        console.log(`   Amount: ${ethers.formatEther(intent.makerAmount)} ETH → ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Rate: 1 ETH = ${(Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount))).toFixed(2)} ALGO`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        
        // Submit order
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        const tx = await this.contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { 
                gasLimit: 500000,
                value: intent.makerAmount
            }
        );
        
        console.log(`⏳ Order submission: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Extract order ID
        const orderId = this.extractOrderId(receipt);
        
        console.log(`✅ Order #${orderNumber} submitted successfully!`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Gas Used: ${receipt.gasUsed}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        
        return { orderId, intent, secret, hashlock, txHash: tx.hash };
    }

    async createEIP712Signature(intent) {
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111,
            verifyingContract: this.contractAddress
        };
        
        const types = {
            LimitOrderIntent: [
                { name: 'maker', type: 'address' },
                { name: 'makerToken', type: 'address' },
                { name: 'takerToken', type: 'address' },
                { name: 'makerAmount', type: 'uint256' },
                { name: 'takerAmount', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
                { name: 'algorandChainId', type: 'uint256' },
                { name: 'algorandAddress', type: 'string' },
                { name: 'salt', type: 'bytes32' },
                { name: 'allowPartialFills', type: 'bool' },
                { name: 'minPartialFill', type: 'uint256' }
            ]
        };
        
        return await this.user.signTypedData(domain, types, intent);
    }

    extractOrderId(receipt) {
        for (const log of receipt.logs) {
            try {
                const parsed = this.contract.interface.parseLog(log);
                if (parsed.name === 'LimitOrderCreated') {
                    return parsed.args.orderId;
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    async monitorRelayerActivity() {
        console.log('\n🔍 MONITORING RELAYER ACTIVITY');
        console.log('==============================');
        
        let lastOrderCount = 0;
        
        // Monitor relayer database every 10 seconds
        const monitorInterval = setInterval(async () => {
            try {
                if (fs.existsSync('relayer-db.json')) {
                    const dbData = JSON.parse(fs.readFileSync('relayer-db.json', 'utf8'));
                    const currentOrderCount = dbData.orderMappings?.length || 0;
                    
                    if (currentOrderCount > lastOrderCount) {
                        console.log(`🎉 RELAYER DETECTED NEW ORDER!`);
                        console.log(`   Total orders tracked: ${currentOrderCount}`);
                        
                        // Show latest order
                        const latestOrder = dbData.orderMappings[dbData.orderMappings.length - 1];
                        console.log(`   Latest order: ${latestOrder[0]}`);
                        console.log(`   Status: ${latestOrder[1].status}`);
                        console.log(`   Direction: ${latestOrder[1].direction}`);
                        
                        if (latestOrder[1].htlcId) {
                            console.log(`   Algorand HTLC: ${latestOrder[1].htlcId}`);
                        }
                        
                        lastOrderCount = currentOrderCount;
                    }
                }
                
                // Check for successful swaps
                if (fs.existsSync('successful-atomic-swaps.log')) {
                    const swaps = fs.readFileSync('successful-atomic-swaps.log', 'utf8').split('\n').filter(line => line.trim());
                    if (swaps.length > 0) {
                        console.log(`🎊 SUCCESSFUL SWAPS: ${swaps.length}`);
                    }
                }
                
            } catch (error) {
                console.log('⚠️ Error monitoring relayer:', error.message);
            }
        }, 10000);
        
        return monitorInterval;
    }

    async runAutomatedDemo() {
        try {
            await this.initialize();
            
            console.log('\n🚀 STARTING AUTOMATED RELAYER DEMO');
            console.log('==================================');
            console.log('✅ Creating multiple orders');
            console.log('✅ Relayer will process automatically');
            console.log('✅ Real-time monitoring enabled');
            console.log('==================================\n');
            
            // Start monitoring
            const monitorInterval = await this.monitorRelayerActivity();
            
            // Create orders with delays
            const orders = [];
            
            for (let i = 1; i <= 3; i++) {
                console.log(`\n🔄 CREATING ORDER #${i}...`);
                const order = await this.createAutomatedOrder(i);
                orders.push(order);
                
                console.log(`⏳ Waiting for relayer to process order #${i}...`);
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second delay
            }
            
            console.log('\n🎯 AUTOMATED DEMO COMPLETE!');
            console.log('============================');
            console.log(`✅ Created ${orders.length} orders`);
            console.log('✅ Relayer is processing automatically');
            console.log('✅ Monitoring continues...');
            console.log('\n📊 ORDER SUMMARY:');
            
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                console.log(`   Order #${i + 1}: ${order.orderId}`);
                console.log(`   Amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
                console.log(`   TX: ${order.txHash}`);
            }
            
            console.log('\n🔍 RELAYER MONITORING ACTIVE');
            console.log('============================');
            console.log('✅ Relayer will continue processing orders');
            console.log('✅ Check relayer-db.json for updates');
            console.log('✅ Monitor successful-atomic-swaps.log');
            console.log('✅ Press Ctrl+C to stop monitoring');
            
            // Keep monitoring active
            process.on('SIGINT', () => {
                console.log('\n🛑 Stopping automated demo...');
                clearInterval(monitorInterval);
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Automated demo failed:', error.message);
            throw error;
        }
    }
}

// Run the automated demo
if (require.main === module) {
    const demo = new AutomatedRelayerDemo();
    demo.runAutomatedDemo().catch(console.error);
}

module.exports = AutomatedRelayerDemo; 