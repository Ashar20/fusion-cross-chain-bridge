#!/usr/bin/env node

/**
 * 🔍 DIAGNOSE LOP CONTRACT ISSUES
 */

const { ethers } = require('ethers');

async function diagnoseLOP() {
    console.log('🔍 DIAGNOSING LOP CONTRACT');
    console.log('==========================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
    
    console.log(`🏦 LOP Contract: ${lopAddress}`);
    console.log(`💰 Wallet: ${wallet.address}`);
    
    try {
        // 1. Check if contract exists
        console.log('\n🔍 Step 1: Contract Existence Check');
        const code = await provider.getCode(lopAddress);
        console.log(`   Contract bytecode length: ${code.length} chars`);
        console.log(`   Contract exists: ${code !== '0x' ? '✅ YES' : '❌ NO'}`);
        
        if (code === '0x') {
            console.log('❌ Contract does not exist at this address');
            return;
        }
        
        // 2. Check wallet balance
        console.log('\n🔍 Step 2: Wallet Balance Check');
        const balance = await provider.getBalance(wallet.address);
        console.log(`   ETH Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`   Sufficient for transaction: ${balance > ethers.parseEther('0.01') ? '✅ YES' : '❌ NO'}`);
        
        // 3. Try to call a simple view function first
        console.log('\n🔍 Step 3: Simple Contract Interaction Test');
        
        const lopABI = [
            'function limitOrders(bytes32 orderId) external view returns (tuple(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool partialFillsEnabled, uint256 minFillAmount) intent, bytes32 hashlock, uint256 timelock, uint256 depositedAmount, uint256 filledAmount, uint256 remainingAmount, bool fullyFilled, bool cancelled, uint256 createdAt, address[] resolvers, uint256 fillCount))',
            'function getOrderId(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool partialFillsEnabled, uint256 minFillAmount) intent, bytes32 hashlock, uint256 timelock) external view returns (bytes32)',
            'function createLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool partialFillsEnabled, uint256 minFillAmount) intent, bytes32 hashlock, uint256 timelock) external payable returns (bytes32 orderId)'
        ];
        
        const lopContract = new ethers.Contract(lopAddress, lopABI, wallet);
        
        // Test with a simple intent to get order ID
        const testIntent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress,
            takerToken: ethers.ZeroAddress,
            makerAmount: ethers.parseEther('0.001'),
            takerAmount: ethers.parseUnits('1000000', 0),
            deadline: Math.floor(Date.now() / 1000) + 3600,
            algorandChainId: 416002,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            partialFillsEnabled: true,
            minFillAmount: ethers.parseEther('0.0001')
        };
        
        const testHashlock = ethers.keccak256(ethers.randomBytes(32));
        const testTimelock = Math.floor(Date.now() / 1000) + 1800;
        
        console.log('   Testing getOrderId view function...');
        try {
            const orderId = await lopContract.getOrderId(testIntent, testHashlock, testTimelock);
            console.log(`   ✅ getOrderId successful: ${orderId.slice(0, 10)}...`);
        } catch (error) {
            console.log(`   ❌ getOrderId failed: ${error.message}`);
            return;
        }
        
        // 4. Test gas estimation for createLimitOrder
        console.log('\n🔍 Step 4: Gas Estimation Test');
        try {
            const gasEstimate = await lopContract.createLimitOrder.estimateGas(
                testIntent, 
                testHashlock, 
                testTimelock
            );
            console.log(`   ✅ Gas estimation successful: ${gasEstimate.toString()}`);
            
            // 5. Try actual transaction with small amount
            console.log('\n🔍 Step 5: Actual Transaction Test');
            console.log('   Creating limit order with minimal parameters...');
            
            const tx = await lopContract.createLimitOrder(
                testIntent,
                testHashlock,
                testTimelock,
                {
                    gasLimit: gasEstimate * 2n,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`   🔗 Transaction: ${tx.hash}`);
            console.log('   ⏳ Waiting for confirmation...');
            
            const receipt = await tx.wait();
            console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
            console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
            
            // Check for events
            const events = receipt.logs.map(log => {
                try {
                    return lopContract.interface.parseLog(log);
                } catch {
                    return null;
                }
            }).filter(Boolean);
            
            console.log(`   📋 Events emitted: ${events.length}`);
            for (const event of events) {
                console.log(`     - ${event.name}: ${event.args.orderId || 'N/A'}`);
            }
            
            console.log('\n🎉 SUCCESS: LOP Contract is working correctly!');
            
        } catch (gasError) {
            console.log(`   ❌ Gas estimation failed: ${gasError.message}`);
            
            // Try to get more details about the revert
            if (gasError.data) {
                console.log(`   Raw error data: ${gasError.data}`);
            }
            
            console.log('\n🔍 POSSIBLE CAUSES:');
            console.log('   - Contract access restrictions');
            console.log('   - Invalid parameter values');
            console.log('   - Missing contract permissions');
            console.log('   - Deadline/timelock validation failures');
            console.log('   - Insufficient contract balance');
        }
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
}

diagnoseLOP().catch(console.error);