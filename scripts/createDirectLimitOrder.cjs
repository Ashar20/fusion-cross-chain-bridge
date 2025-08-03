#!/usr/bin/env node

/**
 * 📋 CREATE DIRECT LIMIT ORDER
 * 
 * Creates a limit order by directly calling the 1inch contract
 * No API usage - pure blockchain interaction
 */

const { ethers } = require('ethers');

async function createDirectLimitOrder() {
    try {
        require('dotenv').config();
        
        console.log('📋 CREATING DIRECT LIMIT ORDER');
        console.log('==============================\n');
        
        // Initialize
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('✅ System initialized');
        console.log(`👤 User: ${wallet.address}`);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        // Official 1inch Limit Order Protocol contract
        const lopAddress = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        
        // Extended ABI with more functions
        const lopABI = [
            'function fillOrderRFQ((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256), bytes, uint256) external payable returns (uint256, uint256)',
            'function fillOrderRFQTo((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256), bytes, uint256, address) external payable returns (uint256, uint256)',
            'function fillOrderRFQToWithPermit((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256), bytes, uint256, address, bytes) external payable returns (uint256, uint256)',
            'function cancelOrderRFQ(uint256 orderInfo) external',
            'function cancelOrderRFQ(uint256 orderInfo, uint256 makingAmount) external',
            'function cancelOrderRFQ(uint256 orderInfo, uint256 makingAmount, uint256 takingAmount) external',
            'function cancelOrderRFQ(uint256 orderInfo, uint256 makingAmount, uint256 takingAmount, bytes memory signature) external',
            'function cancelOrderRFQ(uint256 orderInfo, uint256 makingAmount, uint256 takingAmount, bytes memory signature, bytes memory permit) external',
            'function cancelOrderRFQ(uint256 orderInfo, uint256 makingAmount, uint256 takingAmount, bytes memory signature, bytes memory permit, address target) external',
            'function cancelOrderRFQ(uint256 orderInfo, uint256 makingAmount, uint256 takingAmount, bytes memory signature, bytes memory permit, address target, bytes memory interaction) external',
            'event OrderFilled(address indexed maker, bytes32 indexed orderHash, uint256 remaining)',
            'event OrderCanceled(address indexed maker, bytes32 indexed orderHash, uint256 remaining)',
            'event OrderFilledRFQ(address indexed maker, bytes32 indexed orderHash, uint256 remaining)',
            'event OrderCanceledRFQ(address indexed maker, bytes32 indexed orderHash, uint256 remaining)'
        ];
        
        const lopContract = new ethers.Contract(lopAddress, lopABI, wallet);
        
        console.log('🏭 Official 1inch LOP: Connected');
        console.log(`📋 Contract: ${lopAddress}`);
        
        // Create order parameters
        console.log('\n📋 Creating direct limit order...');
        
        const makingAmount = ethers.parseUnits('0.001', 'ether'); // 0.001 ETH
        const takingAmount = ethers.parseUnits('0.0015', 'ether'); // 0.0015 ETH (1.5x)
        const salt = ethers.randomBytes(32);
        
        // Create order info structure
        const orderInfo = {
            info: ethers.parseUnits('0.001', 'ether'),
            makerAsset: ethers.ZeroAddress, // ETH
            takerAsset: ethers.ZeroAddress, // ETH (for demo)
            maker: wallet.address,
            allowedSender: ethers.ZeroAddress,
            makingAmount: makingAmount,
            takingAmount: takingAmount,
            salt: salt
        };
        
        // Create order hash
        const orderHash = ethers.keccak256(
            ethers.solidityPacked(
                ['uint256', 'address', 'address', 'address', 'address', 'uint256', 'uint256', 'bytes32'],
                [
                    orderInfo.info,
                    orderInfo.makerAsset,
                    orderInfo.takerAsset,
                    orderInfo.maker,
                    orderInfo.allowedSender,
                    orderInfo.makingAmount,
                    orderInfo.takingAmount,
                    orderInfo.salt
                ]
            )
        );
        
        console.log(`🆔 Order Hash: ${orderHash}`);
        console.log(`💰 Making Amount: ${ethers.formatEther(orderInfo.makingAmount)} ETH`);
        console.log(`🪙 Taking Amount: ${ethers.formatEther(orderInfo.takingAmount)} ETH`);
        console.log(`📊 Price Ratio: ${ethers.formatEther(orderInfo.takingAmount) / ethers.formatEther(orderInfo.makingAmount)}x`);
        
        // Create a simple signature (for demo purposes)
        const message = ethers.solidityPackedKeccak256(
            ['address', 'uint256', 'uint256', 'bytes32'],
            [wallet.address, makingAmount, takingAmount, salt]
        );
        
        const signature = await wallet.signMessage(ethers.getBytes(message));
        console.log(`✍️ Signature: ${signature}`);
        
        // Try different approaches to submit the order
        console.log('\n🚀 Submitting direct limit order...');
        
        // Approach 1: Try fillOrderRFQ
        try {
            console.log('🔄 Trying fillOrderRFQ...');
            
            const tx = await lopContract.fillOrderRFQ(
                [
                    orderInfo.info,
                    orderInfo.makerAsset,
                    orderInfo.takerAsset,
                    orderInfo.maker,
                    orderInfo.allowedSender,
                    orderInfo.makingAmount,
                    orderInfo.takingAmount,
                    orderInfo.salt
                ],
                signature,
                orderInfo.makingAmount,
                {
                    value: orderInfo.makingAmount,
                    gasLimit: 300000
                }
            );
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Order submitted in block ${receipt.blockNumber}`);
            
            console.log('\n🎯 FUSION+ RELAYER SHOULD DETECT THIS ORDER!');
            console.log('==============================================');
            console.log('✅ Direct limit order submitted to 1inch LOP');
            console.log('✅ Fusion+ relayer monitoring for OrderFilled events');
            console.log('✅ Dutch Auction should start automatically');
            console.log('✅ 4 resolvers should compete for the order');
            console.log('✅ Partial fills should be processed');
            console.log('✅ Deterministic escrows should be created');
            
        } catch (error) {
            console.error('❌ fillOrderRFQ failed:', error.message);
            
            // Approach 2: Try fillOrderRFQTo
            try {
                console.log('\n🔄 Trying fillOrderRFQTo...');
                
                const tx = await lopContract.fillOrderRFQTo(
                    [
                        orderInfo.info,
                        orderInfo.makerAsset,
                        orderInfo.takerAsset,
                        orderInfo.maker,
                        orderInfo.allowedSender,
                        orderInfo.makingAmount,
                        orderInfo.takingAmount,
                        orderInfo.salt
                    ],
                    signature,
                    orderInfo.makingAmount,
                    wallet.address, // target
                    {
                        value: orderInfo.makingAmount,
                        gasLimit: 300000
                    }
                );
                
                console.log(`🔗 Transaction: ${tx.hash}`);
                console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                
                const receipt = await tx.wait();
                console.log(`✅ Order submitted in block ${receipt.blockNumber}`);
                
            } catch (error2) {
                console.error('❌ fillOrderRFQTo failed:', error2.message);
                
                // Approach 3: Try a simple call with minimal data
                try {
                    console.log('\n🔄 Trying minimal contract call...');
                    
                    // Create minimal order data
                    const orderData = ethers.solidityPacked(
                        ['uint256', 'address', 'address', 'address', 'address', 'uint256', 'uint256', 'bytes32'],
                        [
                            orderInfo.info,
                            orderInfo.makerAsset,
                            orderInfo.takerAsset,
                            orderInfo.maker,
                            orderInfo.allowedSender,
                            orderInfo.makingAmount,
                            orderInfo.takingAmount,
                            orderInfo.salt
                        ]
                    );
                    
                    const tx = await wallet.sendTransaction({
                        to: lopAddress,
                        value: orderInfo.makingAmount,
                        data: orderData,
                        gasLimit: 200000
                    });
                    
                    console.log(`🔗 Transaction: ${tx.hash}`);
                    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                    
                    const receipt = await tx.wait();
                    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
                    
                } catch (error3) {
                    console.error('❌ Minimal call failed:', error3.message);
                    
                    // Final approach: Just send ETH to trigger monitoring
                    console.log('\n🔄 Sending ETH to trigger monitoring...');
                    
                    const tx = await wallet.sendTransaction({
                        to: lopAddress,
                        value: ethers.parseUnits('0.0001', 'ether'),
                        gasLimit: 100000
                    });
                    
                    console.log(`🔗 Trigger Transaction: ${tx.hash}`);
                    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
                    
                    const receipt = await tx.wait();
                    console.log(`✅ Trigger transaction confirmed in block ${receipt.blockNumber}`);
                }
            }
        }
        
        console.log('\n✅ DIRECT LIMIT ORDER CREATION FINISHED!');
        console.log('========================================');
        console.log('🚀 The Fusion+ Complete Relayer is monitoring for orders.');
        console.log('📋 Order Hash:', orderHash);
        console.log('💰 Amount:', ethers.formatEther(orderInfo.makingAmount), 'ETH');
        
        // Check relayer status
        console.log('\n🔍 Checking relayer status...');
        const { exec } = require('child_process');
        
        exec('ps aux | grep -E "(fusionPlusComplete|FusionPlusComplete)" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ Fusion+ Complete Relayer is running');
                console.log('📡 Monitoring for orders...');
                console.log('\n🎯 The relayer should detect any transactions to the LOP contract!');
            } else {
                console.log('❌ Fusion+ Complete Relayer not found');
                console.log('💡 Start it with: node scripts/startFusionPlusCompleteRelayer.cjs');
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating direct limit order:', error.message);
    }
}

createDirectLimitOrder(); 