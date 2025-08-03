#!/usr/bin/env node

/**
 * 🔍 CHECK RELAYER GASLESS EXECUTION
 * 
 * Checks what the relayer should be doing for gasless execution
 */

const { ethers } = require('ethers');

async function checkRelayerGaslessExecution() {
    console.log('🔍 CHECKING RELAYER GASLESS EXECUTION');
    console.log('=====================================\n');
    
    try {
        require('dotenv').config();
        
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
        const contractAddress = '0x384B0011f6E6aA8C192294F36dCE09a3758Df788';
        
        // Load the relayer configuration
        const relayerEnv = require('fs').readFileSync('.env.relayer', 'utf8');
        const relayerConfig = {};
        relayerEnv.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                relayerConfig[key.trim()] = value.trim().replace(/"/g, '');
            }
        });
        
        console.log('🔧 RELAYER CONFIGURATION:');
        console.log('========================');
        console.log(`💰 ETH Relayer: ${relayerConfig.RELAYER_ETH_ADDRESS}`);
        console.log(`🔑 ETH Private Key: ${relayerConfig.RELAYER_ETH_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET'}`);
        console.log(`💰 ALGO Relayer: ${relayerConfig.RELAYER_ALGO_ADDRESS}`);
        console.log(`🔑 ALGO Mnemonic: ${relayerConfig.RELAYER_ALGO_MNEMONIC ? '✅ SET' : '❌ NOT SET'}`);
        
        // Check if relayer is authorized
        const abi = [
            'function authorizedResolvers(address resolver) external view returns (bool)'
        ];
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const isAuthorized = await contract.authorizedResolvers(relayerConfig.RELAYER_ETH_ADDRESS);
        console.log(`🔐 Relayer Authorization: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
        
        // Check recent orders
        console.log('\n📋 RECENT ORDERS:');
        console.log('=================');
        
        const orderIds = [
            '0xe71afe7e6b551fc9984a70ef16706d7ba974cdcf83b7528c2032b7cf5bf54ff0', // Latest
            '0xbdbbfd80426f5ef4f510135228e6f834873a5bfd0d5f2c4b6933abf7f38ffc6f',
            '0x666aae5abdbbaa54b8ed8f7be9f5a7c66cf1a3d00596336a80176dc902791fd9'
        ];
        
        const orderABI = [
            'function limitOrders(bytes32 orderId) external view returns (tuple(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt, bool allowPartialFills, uint256 minPartialFill) intent, bytes32 hashlock, uint256 timelock, uint256 depositedAmount, uint256 remainingAmount, bool filled, bool cancelled, uint256 createdAt, address resolver, uint256 partialFills, tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost) winningBid))',
            'function getBidCount(bytes32 orderId) external view returns (uint256)',
            'function getBids(bytes32 orderId) external view returns (tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost)[])'
        ];
        
        const orderContract = new ethers.Contract(contractAddress, orderABI, provider);
        
        for (const orderId of orderIds) {
            try {
                const order = await orderContract.limitOrders(orderId);
                const bidCount = await orderContract.getBidCount(orderId);
                
                console.log(`\n📋 Order: ${orderId}`);
                console.log(`   Maker: ${order.intent.maker}`);
                console.log(`   Amount: ${ethers.formatEther(order.intent.makerAmount)} ETH`);
                console.log(`   Filled: ${order.filled}`);
                console.log(`   Cancelled: ${order.cancelled}`);
                console.log(`   Bid Count: ${bidCount.toString()}`);
                
                if (bidCount.toString() > 0) {
                    const bids = await orderContract.getBids(orderId);
                    console.log(`   Active Bids: ${bids.filter(b => b.active).length}`);
                    
                    bids.forEach((bid, index) => {
                        if (bid.active) {
                            console.log(`     Bid ${index}: ${bid.resolver} - ${ethers.formatEther(bid.inputAmount)} ETH`);
                        }
                    });
                }
                
                // Check if relayer should execute this order
                if (!order.filled && !order.cancelled && bidCount.toString() > 0) {
                    console.log(`   🎯 RELAYER SHOULD EXECUTE THIS ORDER!`);
                    console.log(`   💡 Use selectBestBidAndExecute(${orderId}, 0, secret)`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
        
        // Check what the relayer should be doing
        console.log('\n🚀 RELAYER GASLESS EXECUTION WORKFLOW:');
        console.log('=====================================');
        console.log('1. 🔍 Monitor for new LimitOrderCreated events');
        console.log('2. 🏆 Place competitive bids on profitable orders');
        console.log('3. ⚡ Execute winning bids with secret revelation');
        console.log('4. 🌉 Create ETH escrows for cross-chain swaps');
        console.log('5. 🪙 Create ALGO HTLCs on Algorand');
        console.log('6. 🔓 Release funds using the same secret');
        console.log('7. ✅ Verify atomic swap completion');
        
        console.log('\n💡 GASLESS FEATURES:');
        console.log('===================');
        console.log('✅ Relayer pays gas fees for users');
        console.log('✅ Users only need to sign off-chain intents');
        console.log('✅ Automatic competitive bidding');
        console.log('✅ Cross-chain atomic swaps');
        console.log('✅ Secret revelation for fund release');
        
        console.log('\n🎯 NEXT STEPS FOR RELAYER:');
        console.log('==========================');
        console.log('1. Ensure relayer is authorized as resolver');
        console.log('2. Monitor for new orders automatically');
        console.log('3. Place bids on profitable orders');
        console.log('4. Execute orders when conditions are met');
        console.log('5. Handle cross-chain escrow creation');
        console.log('6. Complete atomic swaps with secret revelation');
        
    } catch (error) {
        console.error('❌ Error checking relayer:', error.message);
    }
}

checkRelayerGaslessExecution(); 