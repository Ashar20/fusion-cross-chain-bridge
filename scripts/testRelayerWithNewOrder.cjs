#!/usr/bin/env node

/**
 * 🧪 TEST RELAYER WITH NEW ORDER
 * 
 * Creates a new LOP order to test if the relayer picks it up automatically
 */

const { ethers } = require('ethers');
const fs = require('fs');

class TestRelayerWithNewOrder {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.user = null;
        this.provider = null;
    }

    async initialize() {
        console.log('🧪 TESTING RELAYER WITH NEW ORDER');
        console.log('==================================\n');

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

    async createTestOrder() {
        console.log('\n📝 CREATING TEST ORDER FOR RELAYER');
        console.log('==================================\n');

        // Create LOP intent
        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO
            makerAmount: ethers.parseEther('0.002'), // 0.002 ETH
            takerAmount: ethers.parseEther('3.0'),   // 3.0 ALGO
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.0004')
        };
        
        // Generate secret and hashlock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        // Create EIP-712 signature
        const signature = await this.createEIP712Signature(intent);
        
        console.log('📋 TEST ORDER DETAILS:');
        console.log(`   Amount: ${ethers.formatEther(intent.makerAmount)} ETH → ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Rate: 1 ETH = ${(Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount))).toFixed(2)} ALGO`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Secret: ${secret}`);
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
        
        console.log(`✅ Order submitted successfully!`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Gas Used: ${receipt.gasUsed}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        
        console.log('\n🎯 RELAYER TEST INSTRUCTIONS:');
        console.log('==============================');
        console.log('1. ✅ Order created and submitted to blockchain');
        console.log('2. 🔍 Relayer should detect this order automatically');
        console.log('3. 📡 Relayer should broadcast to resolvers');
        console.log('4. 🏆 Resolvers should place competitive bids');
        console.log('5. ⚡ Best bid should be executed automatically');
        console.log('');
        console.log('⏳ Waiting for relayer to process...');
        console.log('📊 Monitor the relayer logs for activity');
        
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

    async run() {
        try {
            await this.initialize();
            await this.createTestOrder();
            
            console.log('\n🎉 RELAYER TEST ORDER CREATED!');
            console.log('==============================');
            console.log('✅ Test order submitted to blockchain');
            console.log('🔍 Relayer should now detect and process it');
            console.log('📊 Check relayer logs for automated processing');
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            throw error;
        }
    }
}

// Run the test
if (require.main === module) {
    const test = new TestRelayerWithNewOrder();
    test.run().catch(console.error);
}

module.exports = TestRelayerWithNewOrder;
