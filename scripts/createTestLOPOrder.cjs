#!/usr/bin/env node

/**
 * 🎯 CREATE TEST LOP ORDER
 * 
 * Creates a test limit order for the relayer to detect and bid on
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function createTestLOPOrder() {
    console.log('🎯 CREATING TEST LOP ORDER');
    console.log('==========================\n');
    
    try {
        require('dotenv').config();
        
        // Contract address
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Load contract ABI
        const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
        const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        
        const contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);
        
        console.log('✅ Contract initialized');
        console.log(`📋 Address: ${contractAddress}`);
        console.log(`👤 User: ${signer.address}\n`);
        
        // Create limit order intent
        const intent = {
            maker: signer.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO (represented as zero address)
            makerAmount: ethers.parseEther('0.001'), // 0.001 ETH
            takerAmount: ethers.parseEther('1'), // 1 ALGO
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n, // Algorand testnet
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.0001') // 0.0001 ETH minimum
        };
        
        // Generate hashlock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        console.log('📋 Order Details:');
        console.log(`   Maker: ${intent.maker}`);
        console.log(`   Amount: ${ethers.formatEther(intent.makerAmount)} ETH`);
        console.log(`   Target: ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
        console.log(`   Secret: ${secret}`);
        
        console.log('\n🎯 This order should trigger the relayer to:');
        console.log('   1. Detect the new order');
        console.log('   2. Analyze profitability');
        console.log('   3. Place a competitive bid');
        console.log('   4. Execute if winning\n');
        
        // Submit limit order with ETH value
        const tx = await contract.submitLimitOrder(
            intent,
            ethers.ZeroHash, // signature (not needed for this test)
            hashlock,
            timelock,
            { 
                gasLimit: 500000, 
                value: intent.makerAmount // Include ETH value
            }
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Extract order ID from event
        let orderId = null;
        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed.name === 'LimitOrderCreated') {
                    orderId = parsed.args.orderId;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (orderId) {
            console.log(`🎯 Order ID: ${orderId}`);
            console.log('✅ Limit order created successfully!');
            
            // Save order details for later reference
            const orderDetails = {
                orderId,
                secret: secret,
                hashlock,
                timelock,
                intent,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                createdAt: new Date().toISOString()
            };
            
            fs.writeFileSync('test-lop-order.json', JSON.stringify(orderDetails, null, 2));
            console.log('📄 Order details saved to test-lop-order.json');
            
            console.log('\n🎉 TEST LOP ORDER CREATED!');
            console.log('==========================');
            console.log('✅ Order is live and active');
            console.log('✅ Relayer should detect it within 5 seconds');
            console.log('✅ Check relayer logs for bid placement');
            console.log('✅ Order ID saved for reference');
            console.log('==========================\n');
            
        } else {
            console.log('❌ Order ID not found in events');
        }
        
    } catch (error) {
        console.error('❌ Error creating test LOP order:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    createTestLOPOrder();
}

module.exports = { createTestLOPOrder }; 