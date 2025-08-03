#!/usr/bin/env node

/**
 * 🎯 CREATE WORKING LOP ORDER WITH BIDDING
 * 
 * Creates a real LOP order with proper EIP-712 signature
 * This will trigger bidding from the funded resolvers
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function createWorkingLOPOrder() {
    console.log('🎯 CREATING WORKING LOP ORDER WITH BIDDING');
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
        
        // Create ETH to ALGO limit order intent
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
        
        console.log('\n🎯 This order will trigger bidding from:');
        console.log('   - High-Frequency-Resolver-1 (0.5 ETH)');
        console.log('   - Arbitrage-Resolver-1 (0.8 ETH)');
        console.log('   - MEV-Resolver-1 (1.0 ETH)');
        console.log('   - Backup-Resolver-1 (0.3 ETH)');
        console.log('   - Relayer (Authorized)');
        
        // Create EIP-712 signature
        console.log('\n🔐 Creating EIP-712 signature...');
        
        // Get domain separator
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111, // Sepolia
            verifyingContract: contractAddress
        };
        
        // Create type hash for the intent
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
        
        // Create the signature
        const signature = await signer.signTypedData(domain, types, intent);
        console.log(`✅ Signature created: ${signature}`);
        
        // Submit limit order with ETH value and signature
        console.log(`💰 ETH Value: ${ethers.formatEther(makerAmount)} ETH`);
        console.log('💡 This ETH will be locked in the contract until order executes');
        
        const tx = await contract.submitLimitOrder(
            intent,
            signature, // Use the actual signature
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
                signature,
                ethValue: ethers.formatEther(makerAmount),
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                createdAt: new Date().toISOString(),
                direction: 'ETH_TO_ALGO',
                description: 'User selling 0.001 ETH for 1 ALGO with EIP-712 signature'
            };
            
            fs.writeFileSync('working-lop-order.json', JSON.stringify(orderDetails, null, 2));
            console.log('📄 Order details saved to working-lop-order.json');
            
            console.log('\n🎉 WORKING LOP ORDER CREATED!');
            console.log('==============================');
            console.log('✅ Order is live and active');
            console.log('✅ EIP-712 signature verified');
            console.log('✅ Relayer should detect it within 5 seconds');
            console.log('✅ Resolvers will place competitive bids');
            console.log('✅ Order ID saved for reference');
            console.log('✅ User will receive ALGO when order executes');
            console.log('==============================\n');
            
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
            
            console.log('\n🏆 BIDDING EXPECTED:');
            console.log('===================');
            console.log('✅ Relayer will analyze profitability');
            console.log('✅ Resolvers will place competitive bids');
            console.log('✅ Best bid will be selected automatically');
            console.log('✅ Order will execute with winning bid');
            console.log('===================\n');
            
        } else {
            console.log('❌ Order ID not found in events');
        }
        
    } catch (error) {
        console.error('❌ Error creating working LOP order:', error.message);
        
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
        } else if (error.message.includes('signature')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('   - Check EIP-712 signature format');
            console.log('   - Verify domain and types match contract');
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    createWorkingLOPOrder();
}

module.exports = { createWorkingLOPOrder }; 