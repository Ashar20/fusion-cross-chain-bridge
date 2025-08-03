#!/usr/bin/env node

/**
 * 📊 CHECK SWAP STATUS
 * 
 * Checks the status of the gasless swap transaction
 */

const { ethers } = require('ethers');

async function checkSwapStatus() {
    try {
        require('dotenv').config();
        
        console.log('📊 CHECKING GASLESS SWAP STATUS');
        console.log('===============================\n');
        
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        
        const txHash = '0x2552e5c617c1c90b24130234a85c35b3ac00cb4dd8960399203ce4ec6138487a';
        
        console.log(`🔗 Transaction Hash: ${txHash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
        
        // Check transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
            console.log(`📦 Block Number: ${receipt.blockNumber}`);
            console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
            console.log(`💰 Effective Gas Price: ${ethers.formatUnits(receipt.gasPrice, 'gwei')} gwei`);
            console.log(`✅ Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
            
            if (receipt.status === 1) {
                console.log('\n🎉 ETHEREUM HTLC CREATED SUCCESSFULLY!');
                console.log('=====================================');
                console.log('✅ Relayer paid ETH gas fees');
                console.log('✅ Cross-chain HTLC established');
                console.log('✅ Ready for secret-based claiming');
                
                // Check for CrossChainOrderCreated event
                const resolverABI = [
                    'event CrossChainOrderCreated(bytes32 indexed orderHash, address indexed maker, address token, uint256 amount, bytes32 hashlock, uint256 timelock, string algorandAddress)'
                ];
                
                const resolverContract = new ethers.Contract(
                    '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64',
                    resolverABI,
                    provider
                );
                
                const orderCreatedEvent = receipt.logs.find(log => {
                    try {
                        const parsed = resolverContract.interface.parseLog(log);
                        return parsed.name === 'CrossChainOrderCreated';
                    } catch {
                        return false;
                    }
                });
                
                if (orderCreatedEvent) {
                    const parsed = resolverContract.interface.parseLog(orderCreatedEvent);
                    console.log(`📋 Order Hash: ${parsed.args.orderHash}`);
                    console.log(`👤 Maker: ${parsed.args.maker}`);
                    console.log(`💰 Amount: ${ethers.formatEther(parsed.args.amount)} ETH`);
                    console.log(`🔒 Hashlock: ${parsed.args.hashlock}`);
                    console.log(`⏰ Timelock: ${parsed.args.timelock}`);
                    console.log(`🪙 ALGO Address: ${parsed.args.algorandAddress}`);
                }
                
            } else {
                console.log('\n❌ TRANSACTION FAILED');
                console.log('====================');
                console.log('❌ Ethereum HTLC creation failed');
                console.log('❌ Check transaction details on Etherscan');
            }
            
        } else {
            console.log('\n⏳ TRANSACTION PENDING');
            console.log('=====================');
            console.log('⏳ Transaction is still being processed');
            console.log('⏳ Waiting for confirmation...');
            
            // Get transaction details
            const tx = await provider.getTransaction(txHash);
            if (tx) {
                console.log(`📦 Nonce: ${tx.nonce}`);
                console.log(`💰 Value: ${ethers.formatEther(tx.value)} ETH`);
                console.log(`⛽ Gas Limit: ${tx.gasLimit.toString()}`);
                console.log(`📤 From: ${tx.from}`);
                console.log(`📥 To: ${tx.to}`);
            }
        }
        
        // Check if the swap process is still running
        const { exec } = require('child_process');
        exec('ps aux | grep -E "(gaslessALGOtoETHSwap|SmallGaslessSwap)" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('\n🔄 SWAP PROCESS STATUS:');
                console.log('=======================');
                console.log('✅ Gasless swap process is still running');
                console.log('🔄 Waiting for transaction confirmation...');
                console.log('🔄 Will proceed to claim ALGO once confirmed');
            } else {
                console.log('\n📊 SWAP PROCESS STATUS:');
                console.log('=======================');
                console.log('❌ Gasless swap process has completed');
                console.log('📊 Check for final results');
            }
        });
        
    } catch (error) {
        console.error('❌ Error checking swap status:', error.message);
    }
}

checkSwapStatus(); 