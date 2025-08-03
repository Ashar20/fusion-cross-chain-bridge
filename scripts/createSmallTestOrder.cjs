#!/usr/bin/env node

/**
 * 📋 CREATE SMALL TEST ORDER
 * 
 * Creates a small test order that will work with available balance
 */

const { ethers } = require('ethers');

async function createSmallTestOrder() {
    try {
        require('dotenv').config();
        
        console.log('📋 CREATING SMALL TEST ORDER');
        console.log('============================\n');
        
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Check balance first
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Current Balance: ${ethers.formatEther(balance)} ETH`);
        
        // Create small order - 0.01 ETH
        const makerAmount = ethers.parseEther('0.01'); // 0.01 ETH
        const takerAmount = ethers.parseEther('10.0');   // 10.0 ALGO (realistic rate)
        
        const currentBlock = await provider.getBlock('latest');
        const deadline = currentBlock.timestamp + 3600;
        const timelock = deadline + 3600;
        
        const salt = ethers.keccak256(ethers.randomBytes(32));
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        // Use a test ALGO address
        const testAlgoAddress = 'BJDBVZITI7VRHJLMPY4C6BX5UVBHZVNT6PRD3ZZWO2E2HSDYGSF4KO6RR4';
        
        const intent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress,
            takerToken: ethers.ZeroAddress,
            makerAmount: makerAmount,
            takerAmount: takerAmount,
            deadline: deadline,
            algorandChainId: 416001, // Correct Algorand testnet
            algorandAddress: testAlgoAddress,
            salt: salt,
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.001')
        };
        
        console.log('📋 Order Intent:');
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ETH`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   ALGO Address: ${intent.algorandAddress}`);
        console.log(`   Hashlock: ${hashlock}`);
        
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111,
            verifyingContract: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788'
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
        
        const signature = await wallet.signTypedData(domain, types, intent);
        
        const abi = [
            'function submitLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32)'
        ];
        
        const contract = new ethers.Contract('0x384B0011f6E6aA8C192294F36dCE09a3758Df788', abi, wallet);
        
        console.log('\n⏳ Submitting small test order...');
        const tx = await contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            { 
                value: makerAmount,
                gasLimit: 300000,
                maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
            }
        );
        
        console.log(`🔗 Transaction: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Order submitted in block ${receipt.blockNumber}`);
        
        // Extract order ID
        const limitOrderCreatedTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
        const orderEvent = receipt.logs.find(log => log.topics[0] === limitOrderCreatedTopic);
        
        if (orderEvent) {
            const orderId = orderEvent.topics[1];
            console.log(`🆔 Order ID: ${orderId}`);
            console.log('\n✅ SMALL TEST ORDER CREATED SUCCESSFULLY!');
            console.log('🎯 This order should be detected by the relayer');
            return orderId;
        } else {
            throw new Error('Order event not found');
        }
        
    } catch (error) {
        console.error('❌ Error creating small test order:', error.message);
        return null;
    }
}

createSmallTestOrder(); 