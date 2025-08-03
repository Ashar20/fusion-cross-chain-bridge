#!/usr/bin/env node

/**
 * 🧪 TEST REAL RELAYER
 * Creates a real order to test if the real relayer detects it
 */

const { ethers } = require('ethers');

async function testRealRelayer() {
    try {
        require('dotenv').config();
        
        console.log('🧪 TESTING REAL RELAYER');
        console.log('========================\n');
        
        // Initialize
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('✅ System initialized');
        console.log(`👤 User: ${wallet.address}`);
        
        // Contract setup
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        const contractABI = [
            'function submitLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32)'
        ];
        
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        // Create order parameters
        const currentBlock = await provider.getBlock('latest');
        const deadline = currentBlock.timestamp + 3600; // 1 hour from now
        const timelock = deadline + 3600; // 2 hours from now
        
        const orderIntent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress,
            takerToken: ethers.ZeroAddress,
            makerAmount: ethers.parseEther('0.005'), // 0.005 ETH
            takerAmount: ethers.parseEther('5.0'), // 5 ALGO
            deadline: deadline,
            algorandChainId: 416001,
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.001')
        };
        
        // Generate signature
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111
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
        
        const signature = await wallet.signTypedData(domain, types, orderIntent);
        
        // Create hashlock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        console.log('📋 Creating test order...');
        console.log(`   Amount: ${ethers.formatEther(orderIntent.makerAmount)} ETH`);
        console.log(`   Wanting: ${ethers.formatEther(orderIntent.takerAmount)} ALGO`);
        console.log(`   Deadline: ${new Date(deadline * 1000)}`);
        
        // Submit order
        const tx = await contract.submitLimitOrder(
            orderIntent,
            signature,
            hashlock,
            timelock,
            {
                value: orderIntent.makerAmount,
                gasLimit: 500000
            }
        );
        
        console.log(`🔗 Transaction: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Order submitted in block ${receipt.blockNumber}`);
        
        // Extract order ID from logs
        const orderCreatedTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
        const orderEvent = receipt.logs.find(log => log.topics[0] === orderCreatedTopic);
        
        if (orderEvent) {
            const orderId = orderEvent.topics[1];
            console.log(`🆔 Order ID: ${orderId}`);
            console.log('\n🎯 REAL RELAYER SHOULD DETECT THIS ORDER!');
            console.log('📡 Check the relayer logs to see if it processes this order.');
        }
        
        console.log('\n✅ Test order created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating test order:', error.message);
    }
}

testRealRelayer(); 