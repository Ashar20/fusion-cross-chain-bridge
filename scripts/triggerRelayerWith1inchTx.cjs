#!/usr/bin/env node

/**
 * 🔄 TRIGGER RELAYER WITH 1INCH TRANSACTION
 * 
 * Sends a transaction to the 1inch LOP contract to trigger relayer monitoring
 */

const { ethers } = require('ethers');

async function triggerRelayerWith1inchTx() {
    try {
        require('dotenv').config();
        
        console.log('🔄 TRIGGERING RELAYER WITH 1INCH TRANSACTION');
        console.log('=============================================\n');
        
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Check balance first
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Current Balance: ${ethers.formatEther(balance)} ETH`);
        
        // Send a simple transaction to the 1inch LOP contract
        // This should trigger the relayer's monitoring
        console.log('\n⏳ Sending transaction to 1inch LOP contract...');
        
        const tx = await wallet.sendTransaction({
            to: '0x68b68381b76e705A7Ef8209800D0886e21b654FE', // 1inch LOP contract
            value: ethers.parseEther('0.001'), // Small amount
            data: ethers.solidityPacked(
                ['string', 'address', 'uint256'],
                ['TEST_1INCH_ORDER', wallet.address, ethers.parseEther('0.01')]
            ),
            gasLimit: 100000,
            maxFeePerGas: ethers.parseUnits('15', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
        });
        
        console.log(`🔗 Transaction: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        
        if (receipt.status === 1) {
            console.log('\n✅ 1INCH TRANSACTION SUCCESSFUL!');
            console.log('🎯 This should trigger the relayer monitoring');
            console.log('📡 The relayer should detect this transaction');
            
            // Check if relayer is running
            const { exec } = require('child_process');
            exec('ps aux | grep -E "(fixedCrossChain|FixedCrossChain)" | grep -v grep', (error, stdout, stderr) => {
                if (stdout) {
                    console.log('\n✅ Relayer is running and should detect this transaction');
                    console.log('🔍 Check relayer logs for detection...');
                    console.log('📊 This will test the 1inch order monitoring functionality');
                } else {
                    console.log('\n❌ Relayer is not running');
                }
            });
            
        } else {
            console.log('\n❌ Transaction failed');
        }
        
    } catch (error) {
        console.error('❌ Error triggering relayer with 1inch tx:', error.message);
    }
}

triggerRelayerWith1inchTx(); 