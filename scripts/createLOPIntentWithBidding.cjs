#!/usr/bin/env node

/**
 * 🎯 CREATE LOP INTENT WITH BIDDING
 * 
 * Simple script to create limit order protocol intents and manage bidding
 * - Create ETH → ALGO or ALGO → ETH orders
 * - Enable competitive bidding
 * - Monitor bid placement and execution
 */

const { ethers } = require('ethers');
const fs = require('fs');

class LOPIntentWithBidding {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.user = null;
        this.provider = null;
    }

    async initialize() {
        console.log('🎯 INITIALIZING LOP INTENT WITH BIDDING');
        console.log('=======================================\n');

        try {
            require('dotenv').config();
            
            // Load deployment info
            const deploymentInfo = JSON.parse(fs.readFileSync('./ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json', 'utf8'));
            this.contractAddress = deploymentInfo.contractAddress;
            
            // Initialize provider and user
            this.provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
            this.user = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            
            // Load contract
            const contractPath = require('path').join(__dirname, '../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json');
            const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            this.contract = new ethers.Contract(this.contractAddress, contractArtifact.abi, this.user);
            
            console.log('✅ System initialized');
            console.log(`📋 Contract: ${this.contractAddress}`);
            console.log(`👤 User: ${this.user.address}`);
            console.log(`🌐 Network: Sepolia Testnet\n`);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }

    async createLOPIntent(direction, params = {}) {
        console.log(`📝 Creating ${direction} LOP Intent...`);
        
        // Default parameters
        const defaults = {
            makerAmount: direction === 'ETH_TO_ALGO' ? ethers.parseEther('0.01') : ethers.parseEther('15'),
            takerAmount: direction === 'ETH_TO_ALGO' ? ethers.parseEther('15') : ethers.parseEther('0.01'),
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            algorandAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
            allowPartialFills: true,
            minPartialFill: direction === 'ETH_TO_ALGO' ? ethers.parseEther('0.001') : ethers.parseEther('1.5')
        };
        
        // Merge with provided parameters
        const config = { ...defaults, ...params };
        
        const intent = {
            maker: this.user.address,
            makerToken: ethers.ZeroAddress, // ETH or ALGO (both represented as zero address)
            takerToken: ethers.ZeroAddress, // ALGO or ETH
            makerAmount: config.makerAmount,
            takerAmount: config.takerAmount,
            deadline: config.deadline,
            algorandChainId: 416001n, // Algorand testnet
            algorandAddress: config.algorandAddress,
            salt: ethers.randomBytes(32),
            allowPartialFills: config.allowPartialFills,
            minPartialFill: config.minPartialFill
        };
        
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        const timelock = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours
        
        console.log('📋 ORDER DETAILS:');
        console.log(`   Direction: ${direction}`);
        console.log(`   Selling: ${ethers.formatEther(intent.makerAmount)} ${direction === 'ETH_TO_ALGO' ? 'ETH' : 'ALGO'}`);
        console.log(`   Wanting: ${ethers.formatEther(intent.takerAmount)} ${direction === 'ETH_TO_ALGO' ? 'ALGO' : 'ETH'}`);
        console.log(`   Rate: 1 ${direction === 'ETH_TO_ALGO' ? 'ETH' : 'ALGO'} = ${(Number(ethers.formatEther(intent.takerAmount)) / Number(ethers.formatEther(intent.makerAmount))).toFixed(2)} ${direction === 'ETH_TO_ALGO' ? 'ALGO' : 'ETH'}`);
        console.log(`   Deadline: ${new Date(Number(intent.deadline) * 1000).toISOString()}`);
        console.log(`   Partial Fills: ${intent.allowPartialFills ? 'Enabled' : 'Disabled'}`);
        console.log(`   Min Partial Fill: ${ethers.formatEther(intent.minPartialFill)} ${direction === 'ETH_TO_ALGO' ? 'ETH' : 'ALGO'}`);
        console.log(`   Hashlock: ${hashlock}`);
        console.log(`   Secret: ${secret}`);
        
        // Create EIP-712 signature
        const signature = await this.createEIP712Signature(intent);
        
        // Submit order
        const txOptions = {
            gasLimit: 500000
        };
        
        // Add ETH value for ETH → ALGO orders
        if (direction === 'ETH_TO_ALGO') {
            txOptions.value = intent.makerAmount;
        }
        
        const tx = await this.contract.submitLimitOrder(
            intent,
            signature,
            hashlock,
            timelock,
            txOptions
        );
        
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        
        const receipt = await tx.wait();
        const orderId = this.extractOrderId(receipt);
        
        console.log(`✅ Order created successfully!`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed}`);
        
        return {
            orderId: orderId,
            direction: direction,
            intent: intent,
            secret: secret,
            hashlock: hashlock,
            timelock: timelock,
            txHash: tx.hash
        };
    }

    async createEIP712Signature(intent) {
        const domain = {
            name: 'EnhancedLimitOrderBridge',
            version: '1',
            chainId: 11155111, // Sepolia
            verifyingContract: this.contractAddress
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
        
        return await this.user.signTypedData(domain, types, intent);
    }

    async placeBid(orderId, inputAmount, outputAmount, gasEstimate) {
        console.log(`🏆 Placing bid on order: ${orderId}`);
        console.log(`   Input: ${ethers.formatEther(inputAmount)}`);
        console.log(`   Output: ${ethers.formatEther(outputAmount)}`);
        console.log(`   Gas Estimate: ${gasEstimate}`);
        
        try {
            const tx = await this.contract.placeBid(
                orderId,
                inputAmount,
                outputAmount,
                gasEstimate
            );
            
            console.log(`⏳ Bid transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Bid placed successfully!`);
            console.log(`   Gas Used: ${receipt.gasUsed}`);
            
            return receipt;
            
        } catch (error) {
            console.error(`❌ Failed to place bid: ${error.message}`);
            throw error;
        }
    }

    async getBestBid(orderId) {
        console.log(`📊 Getting best bid for order: ${orderId}`);
        
        try {
            const [bestBid, bestIndex] = await this.contract.getBestBid(orderId);
            
            console.log('🏆 Best bid found:');
            console.log(`   Resolver: ${bestBid.resolver}`);
            console.log(`   Input: ${ethers.formatEther(bestBid.inputAmount)}`);
            console.log(`   Output: ${ethers.formatEther(bestBid.outputAmount)}`);
            console.log(`   Gas Estimate: ${bestBid.gasEstimate}`);
            console.log(`   Total Cost: ${ethers.formatEther(bestBid.totalCost)}`);
            console.log(`   Bid Index: ${bestIndex}`);
            
            return { bestBid, bestIndex };
            
        } catch (error) {
            console.error(`❌ Failed to get best bid: ${error.message}`);
            throw error;
        }
    }

    async executeBestBid(orderId, bestIndex, secret) {
        console.log(`🎯 Executing best bid for order: ${orderId}`);
        
        try {
            const tx = await this.contract.selectBestBidAndExecute(
                orderId,
                bestIndex,
                secret
            );
            
            console.log(`⏳ Execution transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Best bid executed successfully!`);
            console.log(`   Gas Used: ${receipt.gasUsed}`);
            console.log(`   Block: ${receipt.blockNumber}`);
            
            return receipt;
            
        } catch (error) {
            console.error(`❌ Failed to execute best bid: ${error.message}`);
            throw error;
        }
    }

    async checkOrderStatus(orderId) {
        console.log(`📋 Checking status for order: ${orderId}`);
        
        try {
            const order = await this.contract.limitOrders(orderId);
            
            console.log('📊 Order Status:');
            console.log(`   Maker: ${order.intent.maker}`);
            console.log(`   Maker Amount: ${ethers.formatEther(order.intent.makerAmount)}`);
            console.log(`   Taker Amount: ${ethers.formatEther(order.intent.takerAmount)}`);
            console.log(`   Filled: ${order.filled}`);
            console.log(`   Cancelled: ${order.cancelled}`);
            console.log(`   Created At: ${new Date(Number(order.createdAt) * 1000).toISOString()}`);
            console.log(`   Resolver: ${order.resolver}`);
            console.log(`   Partial Fills: ${order.partialFills}`);
            
            return order;
            
        } catch (error) {
            console.error(`❌ Failed to check order status: ${error.message}`);
            throw error;
        }
    }

    async getBidsForOrder(orderId) {
        console.log(`📊 Getting bids for order: ${orderId}`);
        
        try {
            const bids = await this.contract.bids(orderId);
            
            console.log(`🏆 Found ${bids.length} bids:`);
            
            for (let i = 0; i < bids.length; i++) {
                const bid = bids[i];
                if (bid.active) {
                    console.log(`   Bid ${i}:`);
                    console.log(`     Resolver: ${bid.resolver}`);
                    console.log(`     Input: ${ethers.formatEther(bid.inputAmount)}`);
                    console.log(`     Output: ${ethers.formatEther(bid.outputAmount)}`);
                    console.log(`     Gas Estimate: ${bid.gasEstimate}`);
                    console.log(`     Total Cost: ${ethers.formatEther(bid.totalCost)}`);
                    console.log(`     Timestamp: ${new Date(Number(bid.timestamp) * 1000).toISOString()}`);
                }
            }
            
            return bids;
            
        } catch (error) {
            console.error(`❌ Failed to get bids: ${error.message}`);
            throw error;
        }
    }

    extractOrderId(receipt) {
        for (const log of receipt.logs) {
            try {
                const parsed = this.contract.interface.parseLog(log);
                if (parsed.name === 'LimitOrderCreated') {
                    return parsed.args.orderId;
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    async runExample() {
        console.log('🚀 RUNNING LOP INTENT WITH BIDDING EXAMPLE');
        console.log('==========================================\n');
        
        try {
            await this.initialize();
            
            // Create ETH → ALGO order
            const ethToAlgoOrder = await this.createLOPIntent('ETH_TO_ALGO', {
                makerAmount: ethers.parseEther('0.005'), // 0.005 ETH
                takerAmount: ethers.parseEther('7.5'),   // 7.5 ALGO
                allowPartialFills: true,
                minPartialFill: ethers.parseEther('0.0005')
            });
            
            console.log('\n' + '='.repeat(50) + '\n');
            
            // Create ALGO → ETH order
            const algoToEthOrder = await this.createLOPIntent('ALGO_TO_ETH', {
                makerAmount: ethers.parseEther('7.5'),   // 7.5 ALGO
                takerAmount: ethers.parseEther('0.005'), // 0.005 ETH
                allowPartialFills: true,
                minPartialFill: ethers.parseEther('0.75')
            });
            
            console.log('\n' + '='.repeat(50) + '\n');
            
            // Check order statuses
            await this.checkOrderStatus(ethToAlgoOrder.orderId);
            console.log('\n');
            await this.checkOrderStatus(algoToEthOrder.orderId);
            
            console.log('\n🎉 LOP INTENT WITH BIDDING EXAMPLE COMPLETE!');
            console.log('=============================================');
            console.log('✅ Orders created successfully');
            console.log('✅ Ready for competitive bidding');
            console.log('✅ Use placeBid() to add bids');
            console.log('✅ Use getBestBid() to find winning bid');
            console.log('✅ Use executeBestBid() to execute orders');
            
        } catch (error) {
            console.error('❌ Example failed:', error.message);
            throw error;
        }
    }
}

// Export the class for use in other scripts
module.exports = LOPIntentWithBidding;

// Run example if called directly
if (require.main === module) {
    const lopIntent = new LOPIntentWithBidding();
    lopIntent.runExample().catch(console.error);
} 