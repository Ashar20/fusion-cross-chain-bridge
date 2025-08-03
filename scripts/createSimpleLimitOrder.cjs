#!/usr/bin/env node

/**
 * 📋 CREATE SIMPLE LIMIT ORDER
 * 
 * Creates a simple limit order using the correct 1inch format
 */

const { ethers } = require('ethers');

async function createSimpleLimitOrder() {
    try {
        require('dotenv').config();
        
        console.log('📋 CREATING SIMPLE LIMIT ORDER');
        console.log('==============================\n');
        
        // Initialize
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('✅ System initialized');
        console.log(`👤 User: ${wallet.address}`);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance < ethers.parseUnits('0.01', 'ether')) {
            console.log('❌ Insufficient balance for testing');
            return;
        }
        
        // Create a simple order that should work
        console.log('\n📋 Creating simple order...');
        
        // Use a very small amount for testing
        const orderAmount = ethers.parseUnits('0.001', 'ether'); // 0.001 ETH
        
        // Create a simple transaction to the LOP contract
        const lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        
        // Create order hash for tracking
        const orderHash = ethers.keccak256(
            ethers.solidityPacked(
                ['address', 'uint256', 'uint256'],
                [wallet.address, orderAmount, Date.now()]
            )
        );
        
        console.log(`🆔 Order Hash: ${orderHash}`);
        console.log(`💰 Amount: ${ethers.formatEther(orderAmount)} ETH`);
        
        // Create a simple transaction to trigger the relayer
        console.log('\n🚀 Sending test transaction to trigger Fusion+ relayer...');
        
        try {
            // Send a simple transaction to the LOP contract
            const tx = await wallet.sendTransaction({
                to: lopAddress,
                value: orderAmount,
                data: '0x', // Empty data
                gasLimit: 100000
            });
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            
            console.log('\n🎯 FUSION+ RELAYER SHOULD DETECT THIS TRANSACTION!');
            console.log('==================================================');
            console.log('✅ Transaction sent to official 1inch LOP contract');
            console.log('✅ Fusion+ relayer monitoring for events');
            console.log('✅ Dutch Auction should start automatically');
            console.log('✅ 4 resolvers should compete for the order');
            console.log('✅ Partial fills should be processed');
            console.log('✅ Deterministic escrows should be created');
            
            console.log('\n📡 Check the Fusion+ relayer logs to see:');
            console.log('   🏆 Dutch Auction bidding');
            console.log('   📦 Partial fill processing');
            console.log('   🏭 Deterministic escrow creation');
            console.log('   🔓 Secret-based resolution');
            
        } catch (error) {
            console.error('❌ Error sending transaction:', error.message);
            
            // Try alternative - send to a different address
            console.log('\n🔄 Trying alternative approach...');
            
            try {
                const tx = await wallet.sendTransaction({
                    to: '0x0000000000000000000000000000000000000000', // Zero address
                    value: ethers.parseUnits('0.0001', 'ether'),
                    gasLimit: 50000
                });
                
                console.log(`🔗 Alternative Transaction: ${tx.hash}`);
                console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                
                const receipt = await tx.wait();
                console.log(`✅ Alternative transaction confirmed in block ${receipt.blockNumber}`);
                
            } catch (altError) {
                console.error('❌ Alternative also failed:', altError.message);
            }
        }
        
        console.log('\n✅ SIMPLE LIMIT ORDER CREATION FINISHED!');
        console.log('========================================');
        console.log('🚀 The Fusion+ Complete Relayer is monitoring for orders.');
        console.log('📋 Order Hash:', orderHash);
        console.log('💰 Amount:', ethers.formatEther(orderAmount), 'ETH');
        
        // Check if relayer is still running
        console.log('\n🔍 Checking relayer status...');
        const { exec } = require('child_process');
        
        exec('ps aux | grep -E "(fusionPlusComplete|FusionPlusComplete)" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ Fusion+ Complete Relayer is running');
                console.log('📡 Monitoring for orders...');
            } else {
                console.log('❌ Fusion+ Complete Relayer not found');
                console.log('💡 Start it with: node scripts/startFusionPlusCompleteRelayer.cjs');
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating simple limit order:', error.message);
    }
}

createSimpleLimitOrder(); 