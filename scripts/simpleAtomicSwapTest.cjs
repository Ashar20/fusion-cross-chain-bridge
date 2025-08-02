#!/usr/bin/env node

/**
 * 🧪 SIMPLE ATOMIC SWAP TEST
 * 
 * Simple test with very long timelock to ensure it passes contract validation
 * Uses correct keccak256 hashing method
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

async function simpleAtomicSwapTest() {
    console.log('🧪 SIMPLE ATOMIC SWAP TEST');
    console.log('==========================');
    console.log('✅ Using correct keccak256 hashing');
    console.log('✅ Very long timelock to pass validation');
    console.log('✅ Simple order creation test');
    console.log('==========================\n');
    
    try {
        require('dotenv').config();
        
        // Configuration
        const config = {
            ethereum: {
                rpcUrl: 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64',
                userPrivateKey: process.env.PRIVATE_KEY
            },
            swap: {
                ethAmount: ethers.parseEther('0.001'), // 0.001 ETH
                timelock: 86400 * 7 // 7 days (very long)
            }
        };
        
        // Initialize
        const provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
        const wallet = new ethers.Wallet(config.ethereum.userPrivateKey, provider);
        
        console.log(`✅ Ethereum User: ${wallet.address}`);
        console.log(`✅ Resolver: ${config.ethereum.resolverAddress}`);
        
        // Initialize resolver contract
        const resolver = new ethers.Contract(
            config.ethereum.resolverAddress,
            [
                'function createCrossChainHTLC(bytes32 hashlock, uint256 timelock, address token, uint256 amount, address recipient, string calldata algorandAddress) external payable returns (bytes32)'
            ],
            wallet
        );
        
        // Generate secret and hashlock with keccak256
        const secret = crypto.randomBytes(32);
        const hashlock = ethers.keccak256('0x' + secret.toString('hex'));
        
        console.log('🔒 SWAP PARAMETERS:');
        console.log(`   🔐 Secret: 0x${secret.toString('hex')}`);
        console.log(`   🔒 Hashlock: ${hashlock}`);
        console.log(`   💰 Amount: ${ethers.formatEther(config.swap.ethAmount)} ETH`);
        console.log(`   ⏰ Timelock: ${config.swap.timelock} seconds (${config.swap.timelock / 86400} days)`);
        
        // Verify cryptographic correctness
        const computedHash = ethers.keccak256('0x' + secret.toString('hex'));
        const isCorrect = computedHash === hashlock;
        console.log(`   ✅ Cryptographic Verification: ${isCorrect ? 'PASSED' : 'FAILED'}`);
        console.log('');
        
        // Get current block timestamp
        const currentBlock = await provider.getBlock('latest');
        const actualTimelock = currentBlock.timestamp + config.swap.timelock;
        
        console.log('📋 TIMELOCK CALCULATION:');
        console.log(`   Current Block Timestamp: ${currentBlock.timestamp}`);
        console.log(`   Required Minimum: ${currentBlock.timestamp + 86400} (24 hours)`);
        console.log(`   Actual Timelock: ${actualTimelock}`);
        console.log(`   Difference: ${actualTimelock - (currentBlock.timestamp + 86400)} seconds`);
        console.log(`   Date: ${new Date(actualTimelock * 1000).toISOString()}`);
        console.log('');
        
        // Check if timelock is sufficient
        const isTimelockSufficient = actualTimelock >= (currentBlock.timestamp + 86400);
        console.log(`✅ Timelock Sufficient: ${isTimelockSufficient ? 'YES' : 'NO'}`);
        console.log('');
        
        if (!isTimelockSufficient) {
            throw new Error('Timelock is not sufficient');
        }
        
        // Create the order
        console.log('📤 Creating cross-chain HTLC order...');
        const tx = await resolver.createCrossChainHTLC(
            hashlock,
            actualTimelock,
            ethers.ZeroAddress, // ETH
            config.swap.ethAmount,
            wallet.address, // recipient
            "SIMPLE_TEST_ALGO_ADDRESS",
            { value: config.swap.ethAmount }
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        console.log('');
        console.log('🎉 SIMPLE ATOMIC SWAP TEST SUCCESSFUL!');
        console.log('=====================================');
        console.log('✅ Order created successfully');
        console.log('✅ Correct keccak256 hashing used');
        console.log('✅ Timelock validation passed');
        console.log('✅ Ready for complete demonstration');
        console.log('=====================================\n');
        
        return {
            success: true,
            orderHash: tx.hash,
            secret: '0x' + secret.toString('hex'),
            hashlock: hashlock,
            timelock: actualTimelock
        };
        
    } catch (error) {
        console.error('❌ Simple test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the simple test
simpleAtomicSwapTest().then(result => {
    if (result.success) {
        console.log('✅ Test completed successfully!');
        console.log(`📝 Order Hash: ${result.orderHash}`);
        console.log(`🔐 Secret: ${result.secret}`);
        console.log(`🔒 Hashlock: ${result.hashlock}`);
        process.exit(0);
    } else {
        console.log('❌ Test failed!');
        console.log(`📝 Error: ${result.error}`);
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
}); 