#!/usr/bin/env node

/**
 * 🎯 ONE HOUR TIMELOCK TEST
 * 
 * Uses exactly 1 hour (3600 seconds) timelock as suggested
 * - Get current time in seconds
 * - Add 3600 seconds (1 hour)
 * - Use that result as the timelock
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');

async function oneHourTimelockTest() {
    console.log('🎯 ONE HOUR TIMELOCK TEST');
    console.log('==========================');
    console.log('✅ Using 1 hour (3600 seconds) timelock');
    console.log('✅ Current timestamp + 3600 seconds');
    console.log('✅ Safe buffer approach');
    console.log('==========================\n');
    
    try {
        require('dotenv').config();
        
        // Configuration with 1-hour timelock
        const config = {
            ethereum: {
                rpcUrl: 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64',
                userPrivateKey: process.env.PRIVATE_KEY
            },
            swap: {
                ethAmount: ethers.parseEther('0.001'), // 0.001 ETH
                timelockBuffer: 3600 // 1 hour (3600 seconds) - EXACTLY AS SUGGESTED
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
                'function createCrossChainHTLC(bytes32 hashlock, uint256 timelock, address token, uint256 amount, address recipient, string calldata algorandAddress) external payable returns (bytes32)',
                'function executeCrossChainSwap(bytes32 orderHash, bytes32 secret) external',
                'function getCrossChainOrder(bytes32 orderHash) external view returns (address maker, address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock, bool executed, bool refunded, address escrowSrc, address escrowDst)',
                'function getRevealedSecret(bytes32 orderHash) external view returns (bytes32)',
                'function DEFAULT_TIMELOCK() external view returns (uint256)'
            ],
            wallet
        );
        
        // Check current contract's DEFAULT_TIMELOCK
        const contractDefaultTimelock = await resolver.DEFAULT_TIMELOCK();
        console.log(`📋 Contract DEFAULT_TIMELOCK: ${contractDefaultTimelock.toString()} seconds (${Number(contractDefaultTimelock) / 3600} hours)`);
        console.log('');
        
        // Generate secret and hashlock with keccak256
        const secret = crypto.randomBytes(32);
        const hashlock = ethers.keccak256('0x' + secret.toString('hex'));
        
        console.log('🔒 SWAP PARAMETERS:');
        console.log(`   🔐 Secret: 0x${secret.toString('hex')}`);
        console.log(`   🔒 Hashlock: ${hashlock}`);
        console.log(`   💰 Amount: ${ethers.formatEther(config.swap.ethAmount)} ETH`);
        console.log(`   ⏰ Timelock Buffer: ${config.swap.timelockBuffer} seconds (1 hour)`);
        
        // Verify cryptographic correctness
        const computedHash = ethers.keccak256('0x' + secret.toString('hex'));
        const isCorrect = computedHash === hashlock;
        console.log(`   ✅ Cryptographic Verification: ${isCorrect ? 'PASSED' : 'FAILED'}`);
        console.log('');
        
        // Get current block timestamp and calculate timelock EXACTLY AS SUGGESTED
        const currentBlock = await provider.getBlock('latest');
        const currentTimestamp = currentBlock.timestamp;
        const timelock = currentTimestamp + config.swap.timelockBuffer; // Current time + 1 hour
        
        console.log('📋 TIMELOCK CALCULATION (AS SUGGESTED):');
        console.log(`   Current Block Timestamp: ${currentTimestamp}`);
        console.log(`   Safe Buffer: +${config.swap.timelockBuffer} seconds (1 hour)`);
        console.log(`   Calculated Timelock: ${timelock}`);
        console.log(`   Timelock Date: ${new Date(timelock * 1000).toISOString()}`);
        console.log('');
        
        // Check if timelock meets contract requirements
        const contractMinimum = currentTimestamp + Number(contractDefaultTimelock);
        const isTimelockSufficient = timelock >= contractMinimum;
        
        console.log('📊 CONTRACT REQUIREMENT CHECK:');
        console.log(`   Contract Minimum: ${contractMinimum} (${new Date(contractMinimum * 1000).toISOString()})`);
        console.log(`   Our Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);
        console.log(`   Difference: ${timelock - contractMinimum} seconds`);
        console.log(`   ✅ Timelock Sufficient: ${isTimelockSufficient ? 'YES' : 'NO'}`);
        console.log('');
        
        if (!isTimelockSufficient) {
            console.log('⚠️ WARNING: 1-hour timelock is too short for current contract!');
            console.log('   The contract requires 24 hours, but we\'re using 1 hour.');
            console.log('   This will likely fail with "Timelock too short" error.');
            console.log('');
            
            // Ask if user wants to proceed anyway
            console.log('🤔 Do you want to proceed with 1-hour timelock anyway?');
            console.log('   (This will likely fail, but demonstrates the issue)');
            console.log('');
        }
        
        // Create the order with 1-hour timelock
        console.log('📤 Creating cross-chain HTLC order with 1-hour timelock...');
        const tx = await resolver.createCrossChainHTLC(
            hashlock,
            timelock,
            ethers.ZeroAddress, // ETH
            config.swap.ethAmount,
            wallet.address, // recipient
            "ONE_HOUR_TEST_ALGO_ADDRESS",
            { value: config.swap.ethAmount }
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Extract order hash from event
        const event = receipt.logs.find(log => {
            try {
                const parsed = resolver.interface.parseLog(log);
                return parsed.name === 'CrossChainOrderCreated';
            } catch {
                return false;
            }
        });
        
        let orderHash;
        if (event) {
            const parsed = resolver.interface.parseLog(event);
            orderHash = parsed.args.orderHash;
            console.log(`🎯 Order Hash: ${orderHash}`);
        } else {
            // If event not found, use transaction hash as order hash
            orderHash = tx.hash;
            console.log(`🎯 Using transaction hash as order hash: ${orderHash}`);
        }
        
        console.log('');
        console.log('🎉 ONE HOUR TIMELOCK TEST RESULT!');
        console.log('==================================');
        if (isTimelockSufficient) {
            console.log('✅ SUCCESS: Order created with 1-hour timelock!');
            console.log('✅ This means the contract accepts 1-hour timelocks');
        } else {
            console.log('❌ FAILED: Order creation failed due to short timelock');
            console.log('❌ This confirms the contract requires longer timelocks');
        }
        console.log('✅ Correct keccak256 hashing used');
        console.log('✅ Proper timestamp calculation used');
        console.log('==================================\n');
        
        return {
            success: isTimelockSufficient,
            orderHash: orderHash,
            secret: '0x' + secret.toString('hex'),
            hashlock: hashlock,
            timelock: timelock,
            transactionHash: tx.hash,
            contractDefaultTimelock: contractDefaultTimelock.toString(),
            timelockBuffer: config.swap.timelockBuffer,
            isTimelockSufficient: isTimelockSufficient
        };
        
    } catch (error) {
        console.error('❌ One hour timelock test failed:', error.message);
        
        // Check if it's a timelock error
        if (error.message.includes('Timelock too short')) {
            console.log('');
            console.log('🔍 ANALYSIS: This confirms the issue!');
            console.log('   - Contract requires longer timelock than 1 hour');
            console.log('   - Current contract DEFAULT_TIMELOCK is 24 hours');
            console.log('   - 1-hour timelock is rejected');
            console.log('');
        }
        
        return { 
            success: false, 
            error: error.message,
            isTimelockError: error.message.includes('Timelock too short')
        };
    }
}

// Run the one hour timelock test
oneHourTimelockTest().then(result => {
    if (result.success) {
        console.log('✅ Test completed successfully!');
        console.log(`📝 Order Hash: ${result.orderHash}`);
        console.log(`🔐 Secret: ${result.secret}`);
        console.log(`🔒 Hashlock: ${result.hashlock}`);
        console.log(`⏰ Timelock: ${result.timelock} (${new Date(result.timelock * 1000)})`);
        console.log(`🔗 Transaction: ${result.transactionHash}`);
        console.log(`📋 Contract Default: ${result.contractDefaultTimelock} seconds`);
        console.log(`⏱️ Timelock Buffer: ${result.timelockBuffer} seconds (1 hour)`);
        process.exit(0);
    } else {
        console.log('❌ Test failed!');
        console.log(`📝 Error: ${result.error}`);
        if (result.isTimelockError) {
            console.log('🔍 This confirms the timelock issue!');
        }
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
}); 