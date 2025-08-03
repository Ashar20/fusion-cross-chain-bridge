#!/usr/bin/env node

/**
 * 🎯 CREATE ETH TO ALGO LOP ORDER
 * 
 * Creates a real ETH to ALGO limit order for the LOP system
 * This order will be detected by the relayer for bidding
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function createEthToAlgoLOPOrder() {
    console.log('🎯 CREATING ETH TO ALGO LOP ORDER');
    console.log('==================================\n');
    
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
        
        // Check user balance
        const balance = await provider.getBalance(signer.address);
        console.log(`💰 User ETH Balance: ${ethers.formatEther(balance)} ETH`);
        
        // Create ETH to ALGO limit order intent
        // User wants to sell 0.001 ETH for 1 ALGO
        const makerAmount = ethers.parseEther('0.001'); // 0.001 ETH
        const takerAmount = ethers.parseEther('1'); // 1 ALGO
        
        const intent = {
            maker: signer.address,
            makerToken: ethers.ZeroAddress, // ETH
            takerToken: ethers.ZeroAddress, // ALGO (represented as zero address)
            makerAmount: makerAmount,
            takerAmount: takerAmount,
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
        
        console.log('📋 ETH TO ALGO ORDER DETAILS:');
        console.log(`   Maker: ${intent.maker}`);
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ETH`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ALGO`);
        console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
        console.log(`   Secret: ${secret}`);
        console.log(`   Algorand Address: ${intent.algorandAddress}`);
        
        console.log('\n🎯 This ETH to ALGO order will:');
        console.log('   1. Be detected by the relayer');
        console.log('   2. Trigger profitability analysis');
        console.log('   3. Potentially receive competitive bids');
        console.log('   4. Execute when a winning bid is selected');
        console.log('   5. Result in user receiving ALGO for their ETH\n');
        
        // Submit limit order with ETH value
        // For ETH to ALGO orders, we send the ETH amount as value
        console.log(`💰 ETH Value: ${ethers.formatEther(makerAmount)} ETH`);
        console.log('💡 This ETH will be locked in the contract until order executes');
        
        const tx = await contract.submitLimitOrder(
            intent,
            ethers.ZeroHash, // signature (not needed for this test)
            hashlock,
            timelock,
            { 
                gasLimit: 500000,
                value: makerAmount // Include ETH value
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
            console.log('✅ ETH to ALGO limit order created successfully!');
            
            // Save order details for later reference
            const orderDetails = {
                orderId,
                secret: secret,
                hashlock,
                timelock,
                intent,
                ethValue: ethers.formatEther(makerAmount),
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                createdAt: new Date().toISOString(),
                direction: 'ETH_TO_ALGO',
                description: 'User selling 0.001 ETH for 1 ALGO'
            };
            
            fs.writeFileSync('eth-to-algo-lop-order.json', JSON.stringify(orderDetails, null, 2));
            console.log('📄 Order details saved to eth-to-algo-lop-order.json');
            
            console.log('\n🎉 ETH TO ALGO LOP ORDER CREATED!');
            console.log('==================================');
            console.log('✅ Order is live and active');
            console.log('✅ Relayer should detect it within 5 seconds');
            console.log('✅ Check relayer logs for bid placement');
            console.log('✅ Order ID saved for reference');
            console.log('✅ User will receive ALGO when order executes');
            console.log('==================================\n');
            
            // Check order status
            console.log('📊 ORDER STATUS CHECK:');
            console.log('======================');
            
            try {
                const order = await contract.limitOrders(orderId);
                console.log(`   Status: ${order.filled ? 'FILLED' : order.cancelled ? 'CANCELLED' : 'ACTIVE'}`);
                console.log(`   Resolver: ${order.resolver}`);
                console.log(`   Created: ${new Date(Number(order.createdAt) * 1000).toISOString()}`);
                console.log(`   Deposited Amount: ${ethers.formatEther(order.depositedAmount)} ETH`);
                
                const bidCount = await contract.getBidCount(orderId);
                console.log(`   Current Bids: ${bidCount}`);
                
                if (bidCount > 0) {
                    const bids = await contract.getBids(orderId);
                    console.log('   Bid Details:');
                    for (let i = 0; i < bids.length; i++) {
                        const bid = bids[i];
                        console.log(`     Bid ${i}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ETH -> ${ethers.formatEther(bid.outputAmount)} ALGO (${bid.active ? 'ACTIVE' : 'INACTIVE'})`);
                    }
                }
                
            } catch (error) {
                console.log(`   Status: Error checking order - ${error.message}`);
            }
            
        } else {
            console.log('❌ Order ID not found in events');
        }
        
    } catch (error) {
        console.error('❌ Error creating ETH to ALGO LOP order:', error.message);
        
        // Provide helpful error information
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('   - Check wallet ETH balance for gas fees + ETH value');
            console.log('   - Ensure wallet has enough ETH for transaction');
        } else if (error.message.includes('execution reverted')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('   - Check contract parameters');
            console.log('   - Verify minimum order requirements');
            console.log('   - Ensure proper token addresses');
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    createEthToAlgoLOPOrder();
}

module.exports = { createEthToAlgoLOPOrder }; 