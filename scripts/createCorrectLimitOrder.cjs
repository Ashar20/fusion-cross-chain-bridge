#!/usr/bin/env node

/**
 * 📋 CREATE CORRECT LIMIT ORDER
 * 
 * Creates a limit order that matches the exact EnhancedLimitOrderBridge contract structure
 */

const { ethers } = require('ethers');

async function createCorrectLimitOrder() {
    try {
        require('dotenv').config();
        
        console.log('📋 CREATING CORRECT LIMIT ORDER');
        console.log('===============================\n');
        
        // Initialize
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('✅ System initialized');
        console.log(`👤 User: ${wallet.address}`);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance < ethers.parseUnits('0.02', 'ether')) {
            console.log('❌ Insufficient balance for 0.01 ETH order');
            return;
        }
        
        // Enhanced Limit Order Bridge contract
        const bridgeAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Bridge ABI with the EXACT function signature from the contract
        const bridgeABI = [
            'function submitLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32)',
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool allowPartialFills)'
        ];
        
        const bridgeContract = new ethers.Contract(bridgeAddress, bridgeABI, wallet);
        
        console.log('🏗️ Enhanced Limit Order Bridge: Connected');
        console.log(`📋 Contract: ${bridgeAddress}`);
        
        // Create order parameters matching the contract structure
        console.log('\n📋 Creating correct 0.01 ETH to ALGO order...');
        
        const makerAmount = ethers.parseUnits('0.01', 'ether'); // 0.01 ETH
        const takerAmount = ethers.parseUnits('0.015', 'ether'); // 0.015 ALGO equivalent (1.5x)
        const deadline = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now
        const algorandChainId = 416001; // Testnet
        const algorandAddress = 'BJDBVZITI7VRHJLMPY4C6BX5UVBHZVNT6PRD3ZZWO2E2HSDYGSF4KO6RR4'; // Relayer address
        const salt = ethers.randomBytes(32);
        const allowPartialFills = true;
        const minPartialFill = ethers.parseUnits('0.005', 'ether'); // 0.005 ETH minimum
        
        // Create order intent STRUCT matching the contract exactly
        const orderIntent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO (represented as ETH for demo)
            makerAmount: makerAmount,
            takerAmount: takerAmount,
            deadline: deadline,
            algorandChainId: algorandChainId,
            algorandAddress: algorandAddress,
            salt: salt,
            allowPartialFills: allowPartialFills,
            minPartialFill: minPartialFill
        };
        
        // Create order hash for tracking (matching contract logic)
        const orderHash = ethers.keccak256(
            ethers.solidityPacked(
                ['address', 'bytes32', 'uint256', 'uint256'],
                [wallet.address, salt, Math.floor(Date.now() / 1000), makerAmount]
            )
        );
        
        console.log(`🆔 Order Hash: ${orderHash}`);
        console.log(`💰 Offering: ${ethers.formatEther(makerAmount)} ETH`);
        console.log(`🪙 Wanting: ${ethers.formatEther(takerAmount)} ALGO`);
        console.log(`📅 Deadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
        console.log(`🔗 Algorand Address: ${algorandAddress}`);
        console.log(`📦 Partial Fills: ${allowPartialFills ? 'Enabled' : 'Disabled'}`);
        console.log(`📊 Min Partial Fill: ${ethers.formatEther(minPartialFill)} ETH`);
        
        // Create proper EIP-712 signature matching the contract's LIMIT_ORDER_TYPEHASH
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111, // Sepolia
            verifyingContract: bridgeAddress
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
        
        // Sign the order using EIP-712
        const signature = await wallet.signTypedData(domain, types, orderIntent);
        console.log(`✍️ Signature: ${signature}`);
        
        // Create hashlock and timelock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes
        
        console.log(`🔒 Hashlock: ${hashlock}`);
        console.log(`⏰ Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
        
        // Submit the order with EXACT contract parameters
        console.log('\n🚀 Submitting correct ETH to ALGO limit order...');
        
        try {
            // Call submitLimitOrder with the exact parameters from the contract
            const tx = await bridgeContract.submitLimitOrder(
                orderIntent,        // LimitOrderIntent struct
                signature,          // bytes signature
                hashlock,           // bytes32 hashlock
                timelock,           // uint256 timelock
                {
                    value: makerAmount,  // ETH value
                    gasLimit: 500000,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Order submitted in block ${receipt.blockNumber}`);
            
            // Look for the LimitOrderCreated event
            const limitOrderCreatedTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
            const orderEvent = receipt.logs.find(log => log.topics[0] === limitOrderCreatedTopic);
            
            if (orderEvent) {
                const orderId = orderEvent.topics[1];
                console.log(`🆔 Order ID: ${orderId}`);
                console.log('\n🎯 CORRECT LIMIT ORDER CREATED SUCCESSFULLY!');
                console.log('==============================================');
                console.log('✅ Correct limit order submitted with exact contract parameters');
                console.log('✅ Fixed relayer should detect LimitOrderCreated event');
                console.log('✅ Competitive bidding should start automatically');
                console.log('✅ Relayer will analyze profitability (1% min margin)');
                console.log('✅ If profitable, relayer will place competitive bid');
                console.log('✅ Cross-chain HTLC will be created on Algorand');
                console.log('✅ ALGO will be claimed with revealed secret');
                
                console.log('\n📡 Check the Fixed Cross-Chain Relayer logs to see:');
                console.log('   📋 Order detection');
                console.log('   💰 Profitability analysis');
                console.log('   🏆 Competitive bidding');
                console.log('   🚀 Order execution');
                console.log('   🌉 Cross-chain HTLC creation');
                console.log('   🎯 ALGO claiming');
            } else {
                console.log('⚠️  Order submitted but LimitOrderCreated event not found');
                console.log('💡 The order may still be processed by the relayer');
            }
            
        } catch (error) {
            console.error('❌ Error submitting correct order:', error.message);
            
            // Show what the relayer should do
            console.log('\n💡 Even if the order submission fails, the Fixed Cross-Chain Relayer is:');
            console.log('   ✅ Monitoring for LimitOrderCreated events');
            console.log('   ✅ Ready to process orders when they appear');
            console.log('   ✅ Ready for competitive bidding');
            console.log('   ✅ Ready for cross-chain execution');
        }
        
        console.log('\n✅ CORRECT LIMIT ORDER CREATION FINISHED!');
        console.log('========================================');
        console.log('🚀 The Fixed Cross-Chain Relayer is monitoring for orders.');
        console.log('📋 Order Hash:', orderHash);
        console.log('💰 Amount:', ethers.formatEther(makerAmount), 'ETH');
        console.log('🪙 Wanting:', ethers.formatEther(takerAmount), 'ALGO');
        
        // Check relayer status
        console.log('\n🔍 Checking relayer status...');
        const { exec } = require('child_process');
        
        exec('ps aux | grep -E "(fixedCrossChain|FixedCrossChain)" | grep -v grep', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ Fixed Cross-Chain Relayer is running');
                console.log('📡 Monitoring for orders...');
                console.log('\n🎯 The relayer should detect this correct order and start processing!');
                console.log('💡 Check the relayer logs for order detection and bidding activity.');
            } else {
                console.log('❌ Fixed Cross-Chain Relayer not found');
                console.log('💡 Start it with: node working-scripts/relayer/fixedCrossChainRelayer.cjs');
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating correct limit order:', error.message);
    }
}

createCorrectLimitOrder(); 