const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
    console.log('🔍 Checking Existing Ethereum Order Status...');
    console.log('=============================================');

    // Load deployment info
    const fs = require('fs');
    const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

    // Initialize provider and resolver
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);

    // The transaction hash from the interrupted test
    const txHash = '0x5a67ea80d4ebc787f60a5734d9df8c2170ce74d2142eca98f4798fbece3e7608';

    console.log(`📋 Checking transaction: ${txHash}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/tx/${txHash}`);

    try {
        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
            console.log('✅ Transaction confirmed!');
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);

            // Parse events to find order ID
            for (const log of receipt.logs) {
                try {
                    const parsedLog = resolver.interface.parseLog(log);
                    if (parsedLog.name === 'CrossChainOrderCreated') {
                        const orderId = parsedLog.args.orderHash;
                        console.log(`   Order ID: ${orderId}`);
                        
                        // Get order details
                        const order = await resolver.getCrossChainOrder(orderId);
                        console.log('\n📋 Order Details:');
                        console.log(`   Maker: ${order.maker}`);
                        console.log(`   Amount: ${ethers.formatEther(order.amount)} ETH`);
                        console.log(`   Hashlock: ${order.hashlock}`);
                        console.log(`   Timelock: ${order.timelock}`);
                        console.log(`   Recipient: ${order.recipient}`);
                        console.log(`   Executed: ${order.executed}`);
                        console.log(`   Refunded: ${order.refunded}`);
                        
                        console.log('\n🎯 Order is ready for next steps!');
                        console.log('   You can now:');
                        console.log('   1. Create Algorand HTLC');
                        console.log('   2. Create escrow contracts');
                        console.log('   3. Execute the swap');
                        
                        return;
                    }
                } catch (error) {
                    // Skip logs that can't be parsed
                }
            }
            
            console.log('⚠️  CrossChainOrderCreated event not found in transaction');
            
        } else {
            console.log('⏳ Transaction not yet confirmed...');
        }
        
    } catch (error) {
        console.log('❌ Error checking transaction:', error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 
require('dotenv').config();

async function main() {
    console.log('🔍 Checking Existing Ethereum Order Status...');
    console.log('=============================================');

    // Load deployment info
    const fs = require('fs');
    const resolverDeployment = JSON.parse(fs.readFileSync('CROSS_CHAIN_RESOLVER_DEPLOYMENT.json', 'utf8'));

    // Initialize provider and resolver
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const resolver = await ethers.getContractAt('CrossChainHTLCResolver', resolverDeployment.contracts.resolver);

    // The transaction hash from the interrupted test
    const txHash = '0x5a67ea80d4ebc787f60a5734d9df8c2170ce74d2142eca98f4798fbece3e7608';

    console.log(`📋 Checking transaction: ${txHash}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/tx/${txHash}`);

    try {
        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
            console.log('✅ Transaction confirmed!');
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);

            // Parse events to find order ID
            for (const log of receipt.logs) {
                try {
                    const parsedLog = resolver.interface.parseLog(log);
                    if (parsedLog.name === 'CrossChainOrderCreated') {
                        const orderId = parsedLog.args.orderHash;
                        console.log(`   Order ID: ${orderId}`);
                        
                        // Get order details
                        const order = await resolver.getCrossChainOrder(orderId);
                        console.log('\n📋 Order Details:');
                        console.log(`   Maker: ${order.maker}`);
                        console.log(`   Amount: ${ethers.formatEther(order.amount)} ETH`);
                        console.log(`   Hashlock: ${order.hashlock}`);
                        console.log(`   Timelock: ${order.timelock}`);
                        console.log(`   Recipient: ${order.recipient}`);
                        console.log(`   Executed: ${order.executed}`);
                        console.log(`   Refunded: ${order.refunded}`);
                        
                        console.log('\n🎯 Order is ready for next steps!');
                        console.log('   You can now:');
                        console.log('   1. Create Algorand HTLC');
                        console.log('   2. Create escrow contracts');
                        console.log('   3. Execute the swap');
                        
                        return;
                    }
                } catch (error) {
                    // Skip logs that can't be parsed
                }
            }
            
            console.log('⚠️  CrossChainOrderCreated event not found in transaction');
            
        } else {
            console.log('⏳ Transaction not yet confirmed...');
        }
        
    } catch (error) {
        console.log('❌ Error checking transaction:', error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 
 