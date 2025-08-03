#!/usr/bin/env node

/**
 * 🤖 TEST RELAYER AUTOMATION
 * Create a simple LOP order and verify relayer detects and processes it
 */

const { ethers } = require('ethers');
const { FixedCrossChainRelayer } = require('./fixedCrossChainRelayer.cjs');

async function testRelayerAutomation() {
    console.log('🤖 TESTING RELAYER AUTOMATION');
    console.log('=============================');
    
    try {
        // Initialize relayer
        console.log('🚀 Initializing relayer...');
        const relayer = new FixedCrossChainRelayer();
        
        // Start monitoring
        console.log('🔍 Starting LOP monitoring...');
        await relayer.startLOPMonitoring();
        
        // Create a simple test order
        console.log('\n📝 Creating test LOP order...');
        await createTestLOPOrder();
        
        // Wait for relayer to detect it
        console.log('⏳ Waiting for relayer to detect order...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Force check for new orders
        console.log('🔍 Forcing order check...');
        await relayer.checkForNewLOPOrders();
        
        // Check results
        const status = relayer.getStatus();
        console.log('\n📊 RELAYER STATUS AFTER ORDER:');
        console.log('==============================');
        console.log(`📋 Active Orders: ${status.activeOrders}`);
        console.log(`💰 Our Bids: ${status.ourBids}`);
        console.log(`✅ Completed: ${status.completedOrders}`);
        
        if (status.activeOrders > 0) {
            console.log('✅ SUCCESS: Relayer detected the order!');
            
            if (status.ourBids > 0) {
                console.log('🎯 SUCCESS: Relayer placed a bid!');
            } else {
                console.log('⚠️  Order detected but no bid placed (may not be profitable)');
            }
        } else {
            console.log('❌ Relayer did not detect the order');
        }
        
        // Stop monitoring
        relayer.stopMonitoring();
        console.log('\n🔄 Monitoring stopped');
        
        console.log('\n🎉 AUTOMATION TEST COMPLETED');
        console.log('=============================');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

async function createTestLOPOrder() {
    try {
        require('dotenv').config();
        
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        const abi = [
            'function submitLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32)'
        ];
        
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        
        // Create simple order parameters
        const intent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO
            makerAmount: ethers.parseEther('0.001'), // 0.001 ETH
            takerAmount: ethers.parseEther('1.0'), // 1.0 ALGO
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            algorandChainId: 416002,
            algorandAddress: process.env.ALGORAND_ACCOUNT_ADDRESS,
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.0001')
        };
        
        // Create signature (simplified)
        const signature = '0x' + '0'.repeat(130); // Placeholder signature
        const hashlock = ethers.keccak256(ethers.randomBytes(32));
        const timelock = Math.floor(Date.now() / 1000) + 7200; // 2 hours
        
        console.log(`💰 Creating order: ${ethers.formatEther(intent.makerAmount)} ETH → ${ethers.formatEther(intent.takerAmount)} ALGO`);
        
        const tx = await contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { value: intent.makerAmount }
        );
        
        console.log(`⏳ Order submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Order created in block: ${receipt.blockNumber}`);
        
        return receipt;
        
    } catch (error) {
        console.error('❌ Failed to create test order:', error.message);
        throw error;
    }
}

testRelayerAutomation();