#!/usr/bin/env node

/**
 * 🎯 CREATE ALGO TO ETH LOP ORDER (FIXED)
 * 
 * Creates a real ALGO to ETH limit order with proper ETH deposit
 * This order will be detected by the relayer for bidding
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function createAlgoToEthLOPOrderFixed() {
    console.log('🎯 CREATING ALGO TO ETH LOP ORDER (FIXED)');
    console.log('==========================================\n');
    
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
        
        // Create ALGO to ETH limit order intent
        // User wants to sell 1 ALGO for 0.001 ETH
        const makerAmount = ethers.parseEther('1'); // 1 ALGO
        const takerAmount = ethers.parseEther('0.001'); // 0.001 ETH
        
        const intent = {
            maker: signer.address,
            makerToken: ethers.ZeroAddress, // ALGO (represented as zero address)
            takerToken: ethers.ZeroAddress, // ETH (represented as zero address)
            makerAmount: makerAmount,
            takerAmount: takerAmount,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandChainId: 416001n, // Algorand testnet
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            salt: ethers.randomBytes(32),
            allowPartialFills: true,
            minPartialFill: ethers.parseEther('0.1') // 0.1 ALGO minimum
        };
        
        // Generate hashlock
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        console.log('📋 ALGO TO ETH ORDER DETAILS:');
        console.log(`   Maker: ${intent.maker}`);
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ALGO`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ETH`);
        console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);
        console.log(`   Secret: ${secret}`);
        console.log(`   Algorand Address: ${intent.algorandAddress}`);
        
        console.log('\n🎯 This ALGO to ETH order will:');
        console.log('   1. Be detected by the relayer');
        console.log('   2. Trigger profitability analysis');
        console.log('   3. Potentially receive competitive bids');
        console.log('   4. Execute when a winning bid is selected');
        console.log('   5. Result in user receiving ETH for their ALGO\n');
        
        // Submit limit order with ETH deposit
        // For ALGO to ETH orders, we need to deposit ETH as collateral
        const ethDeposit = ethers.parseEther('0.002'); // Deposit 0.002 ETH as collateral
        
        console.log(`💰 ETH Deposit: ${ethers.formatEther(ethDeposit)} ETH`);
        console.log('💡 This ETH serves as collateral for the ALGO order');
        
        const tx = await contract.submitLimitOrder(
            intent,
            ethers.ZeroHash, // signature (not needed for this test)
            hashlock,
            timelock,
            { 
                gasLimit: 500000,
                value: ethDeposit // Include ETH deposit
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
            console.log('✅ ALGO to ETH limit order created successfully!');
            
            // Save order details for later reference
            const orderDetails = {
                orderId,
                secret: secret,
                hashlock,
                timelock,
                intent,
                ethDeposit: ethers.formatEther(ethDeposit),
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                createdAt: new Date().toISOString(),
                direction: 'ALGO_TO_ETH',
                description: 'User selling 1 ALGO for 0.001 ETH with 0.002 ETH deposit'
            };
            
            fs.writeFileSync('algo-to-eth-lop-order-fixed.json', JSON.stringify(orderDetails, null, 2));
            console.log('📄 Order details saved to algo-to-eth-lop-order-fixed.json');
            
            console.log('\n🎉 ALGO TO ETH LOP ORDER CREATED!');
            console.log('==================================');
            console.log('✅ Order is live and active');
            console.log('✅ Relayer should detect it within 5 seconds');
            console.log('✅ Check relayer logs for bid placement');
            console.log('✅ Order ID saved for reference');
            console.log('✅ User will receive ETH when order executes');
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
                        console.log(`     Bid ${i}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ALGO -> ${ethers.formatEther(bid.outputAmount)} ETH (${bid.active ? 'ACTIVE' : 'INACTIVE'})`);
                    }
                }
                
            } catch (error) {
                console.log(`   Status: Error checking order - ${error.message}`);
            }
            
        } else {
            console.log('❌ Order ID not found in events');
        }
        
    } catch (error) {
        console.error('❌ Error creating ALGO to ETH LOP order:', error.message);
        
        // Provide helpful error information
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('   - Check wallet ETH balance for gas fees + deposit');
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
    createAlgoToEthLOPOrderFixed();
}

module.exports = { createAlgoToEthLOPOrderFixed }; 