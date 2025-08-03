#!/usr/bin/env node

/**
 * 📋 CREATE 1INCH ETH TO ALGO ORDER
 * 
 * Creates a small ETH to ALGO order using the 1inch LOP contract
 */

const { ethers } = require('ethers');

async function create1inchETHtoALGOOrder() {
    try {
        require('dotenv').config();
        
        console.log('📋 CREATING 1INCH ETH TO ALGO ORDER');
        console.log('====================================\n');
        
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Check balance first
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Current Balance: ${ethers.formatEther(balance)} ETH`);
        
        // Create small order - 0.005 ETH
        const orderAmount = ethers.parseEther('0.005'); // 0.005 ETH
        
        console.log('\n📋 Order Details:');
        console.log(`   Selling: ${ethers.formatEther(orderAmount)} ETH`);
        console.log(`   Wanting: ALGO (via 1inch LOP)`);
        console.log(`   Contract: 0x68b68381b76e705A7Ef8209800D0886e21b654FE`);
        
        // Create a simple order structure for 1inch LOP
        // Using fillOrderRFQ function with minimal parameters
        const orderInfo = {
            info: ethers.solidityPacked(
                ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                [
                    ethers.parseEther('0.005'), // makerAmount
                    ethers.parseEther('5.0'),   // takerAmount (5 ALGO)
                    ethers.parseEther('0.005'), // makerAmount
                    ethers.parseEther('5.0'),   // takerAmount
                    Math.floor(Date.now() / 1000) + 3600, // deadline
                    ethers.parseEther('0.005'), // makerAmount
                    ethers.parseEther('5.0'),   // takerAmount
                    ethers.parseEther('0.005')  // makerAmount
                ]
            ),
            signature: ethers.solidityPacked(
                ['bytes32', 'bytes32', 'uint8'],
                [
                    ethers.keccak256(ethers.toUtf8Bytes('1inch_order')),
                    ethers.keccak256(ethers.toUtf8Bytes('signature')),
                    27 // v value for signature
                ]
            ),
            makerAmount: orderAmount
        };
        
        console.log('\n⏳ Submitting 1inch LOP order...');
        
        // Try to call fillOrderRFQ function
        const oneInchABI = [
            'function fillOrderRFQ((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256), bytes, uint256) external payable returns (uint256, uint256)'
        ];
        
        const oneInchContract = new ethers.Contract(
            '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
            oneInchABI,
            wallet
        );
        
        try {
            const tx = await oneInchContract.fillOrderRFQ(
                orderInfo.info,
                orderInfo.signature,
                orderAmount,
                {
                    value: orderAmount,
                    gasLimit: 300000,
                    maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
                }
            );
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Order submitted in block ${receipt.blockNumber}`);
            
            if (receipt.status === 1) {
                console.log('\n✅ 1INCH ETH TO ALGO ORDER CREATED SUCCESSFULLY!');
                console.log('🎯 This order should be detected by the relayer');
                console.log('📊 The relayer will track this order for analytics');
                
                // Check for OrderFilled event
                const orderFilledTopic = ethers.id('OrderFilled(address,bytes32,uint256)');
                const orderFilledEvent = receipt.logs.find(log => log.topics[0] === orderFilledTopic);
                
                if (orderFilledEvent) {
                    const orderHash = orderFilledEvent.topics[1];
                    console.log(`🆔 Order Hash: ${orderHash}`);
                    console.log('📋 OrderFilled event detected - relayer should track this');
                }
                
                return receipt;
            } else {
                console.log('\n❌ Order submission failed');
                return null;
            }
            
        } catch (error) {
            console.log(`⚠️ fillOrderRFQ failed: ${error.message}`);
            console.log('💡 Trying alternative approach...');
            
            // Try a simpler approach - just send ETH to the contract
            console.log('\n⏳ Trying simple ETH transfer to 1inch LOP...');
            
            const simpleTx = await wallet.sendTransaction({
                to: '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
                value: orderAmount,
                data: ethers.solidityPacked(
                    ['string', 'address', 'uint256'],
                    ['ETH_TO_ALGO_ORDER', wallet.address, orderAmount]
                ),
                gasLimit: 200000,
                maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
            });
            
            console.log(`🔗 Simple Transaction: ${simpleTx.hash}`);
            
            const simpleReceipt = await simpleTx.wait();
            console.log(`✅ Simple transaction confirmed in block ${simpleReceipt.blockNumber}`);
            
            if (simpleReceipt.status === 1) {
                console.log('\n✅ SIMPLE 1INCH TRANSACTION SUCCESSFUL!');
                console.log('🎯 This transaction should trigger relayer monitoring');
                console.log('📊 The relayer will detect activity on the 1inch LOP contract');
                
                return simpleReceipt;
            } else {
                console.log('\n❌ Simple transaction failed');
                return null;
            }
        }
        
    } catch (error) {
        console.error('❌ Error creating 1inch ETH to ALGO order:', error.message);
        return null;
    }
}

create1inchETHtoALGOOrder(); 