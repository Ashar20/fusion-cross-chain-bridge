#!/usr/bin/env node

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');

class EnhancedBiddingRelayer {
    constructor() {
        this.ethereumProvider = null;
        this.algorandClient = null;
        this.contract = null;
        this.algorandAppId = 743645803;
        this.resolverAddress = null;
        this.resolverPrivateKey = null;
        this.algorandAccount = null;
        this.biddingStrategy = 'competitive';
        this.minProfitMargin = 0.02; // 2% minimum profit
        this.maxBidDuration = 5 * 60; // 5 minutes
        this.isRunning = false;
    }

    async initialize() {
        console.log('🚀 INITIALIZING ENHANCED BIDDING RELAYER...\n');

        // Load environment variables
        this.loadEnvironment();

        // Initialize Ethereum connection
        this.ethereumProvider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT);
        this.resolverAddress = process.env.RESOLVER_ADDRESS;
        this.resolverPrivateKey = process.env.RESOLVER_PRIVATE_KEY;
        
        // Initialize Algorand connection
        this.algorandClient = new algosdk.Algodv2(
            process.env.ALGORAND_API_KEY,
            process.env.ALGORAND_SERVER,
            process.env.ALGORAND_PORT
        );

        // Load Algorand account
        this.algorandAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);

        // Initialize contract
        await this.initializeContract();

        console.log('✅ Enhanced bidding relayer initialized!\n');
    }

    loadEnvironment() {
        // Load from .env.resolvers if available
        try {
            require('dotenv').config({ path: '.env.resolvers' });
        } catch (error) {
            console.log('⚠️  .env.resolvers not found, using default environment');
        }

        // Validate required environment variables
        const required = [
            'INFURA_ENDPOINT',
            'RESOLVER_ADDRESS', 
            'RESOLVER_PRIVATE_KEY',
            'ALGORAND_API_KEY',
            'ALGORAND_SERVER',
            'ALGORAND_PORT',
            'ALGORAND_MNEMONIC'
        ];

        for (const envVar of required) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
    }

    async initializeContract() {
        // Try to load deployment info
        let contractAddress;
        try {
            const deploymentInfo = require('../../ENHANCED_LIMIT_ORDER_BRIDGE_DEPLOYMENT.json');
            contractAddress = deploymentInfo.contractAddress;
            console.log(`📋 Using deployed contract: ${contractAddress}`);
        } catch (error) {
            console.log('⚠️  No deployment info found, using default address');
            contractAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
        }

        // Load contract ABI
        const contractABI = require('../../artifacts/contracts/EnhancedLimitOrderBridge.sol/EnhancedLimitOrderBridge.json').abi;
        this.contract = new ethers.Contract(contractAddress, contractABI, this.ethereumProvider);
    }

    async startBiddingService() {
        console.log('🏆 STARTING BIDDING SERVICE...\n');

        this.isRunning = true;

        // Monitor for new orders
        this.contract.on('LimitOrderCreated', async (orderId, maker, makerToken, takerToken, makerAmount, takerAmount, deadline, algorandAddress, hashlock, timelock, allowPartialFills) => {
            if (!this.isRunning) return;
            
            console.log(`🎯 New order detected: ${orderId}`);
            console.log(`   Maker: ${maker}`);
            console.log(`   Amount: ${ethers.formatEther(makerAmount)} ETH`);
            console.log(`   Target: ${ethers.formatEther(takerAmount)} ALGO`);
            console.log(`   Partial fills: ${allowPartialFills ? 'Enabled' : 'Disabled'}`);

            // Analyze order and place competitive bid
            await this.analyzeAndBid(orderId, {
                maker,
                makerAmount,
                takerAmount,
                deadline,
                algorandAddress,
                allowPartialFills
            });
        });

        // Monitor for bid placements
        this.contract.on('BidPlaced', async (orderId, resolver, inputAmount, outputAmount, gasEstimate, totalCost) => {
            if (!this.isRunning) return;
            
            console.log(`🏆 Bid placed: ${orderId} by ${resolver}`);
            console.log(`   Rate: ${ethers.formatEther(outputAmount)} / ${ethers.formatEther(inputAmount)}`);
            
            // Check if we need to improve our bid
            if (resolver !== this.resolverAddress) {
                await this.considerBidImprovement(orderId, outputAmount, inputAmount);
            }
        });

        // Monitor for best bid selection
        this.contract.on('BestBidSelected', async (orderId, resolver, inputAmount, outputAmount) => {
            if (!this.isRunning) return;
            
            console.log(`🎯 Best bid selected: ${orderId}`);
            console.log(`   Winner: ${resolver}`);
            
            if (resolver === this.resolverAddress) {
                console.log('🏆 We won the bid! Executing swap...');
                await this.executeWinningSwap(orderId);
            }
        });

        // Monitor for partial fills
        this.contract.on('LimitOrderPartiallyFilled', async (orderId, resolver, filledAmount, remainingAmount, algorandAmount, resolverFee) => {
            if (!this.isRunning) return;
            
            console.log(`🔄 Partial fill: ${orderId}`);
            console.log(`   Filled: ${ethers.formatEther(filledAmount)} ETH`);
            console.log(`   Remaining: ${ethers.formatEther(remainingAmount)} ETH`);
            console.log(`   ALGO: ${ethers.formatEther(algorandAmount)}`);
        });

        console.log('✅ Bidding service started!\n');
    }

    async analyzeAndBid(orderId, orderDetails) {
        try {
            console.log(`🔍 Analyzing order ${orderId}...`);

            // Get current market rates
            const marketRate = await this.getCurrentMarketRate();
            
            // Calculate competitive bid
            const bid = await this.calculateCompetitiveBid(orderDetails, marketRate);
            
            if (bid.profitable) {
                console.log(`💰 Placing profitable bid: ${bid.rate} (${bid.profitMargin.toFixed(2)}% profit)`);
                
                await this.placeBid(orderId, bid);
            } else {
                console.log(`❌ Order not profitable: ${bid.rate} (${bid.profitMargin.toFixed(2)}% loss)`);
            }

        } catch (error) {
            console.error(`❌ Error analyzing order ${orderId}:`, error);
        }
    }

    async calculateCompetitiveBid(orderDetails, marketRate) {
        const { makerAmount, takerAmount, allowPartialFills } = orderDetails;
        
        // Calculate base rate
        const baseRate = Number(ethers.formatEther(takerAmount)) / Number(ethers.formatEther(makerAmount));
        
        // Add competitive margin (slightly better than market)
        const competitiveRate = baseRate * (1 + this.minProfitMargin);
        
        // Calculate gas costs
        const gasEstimate = await this.estimateGasCosts(orderDetails);
        const gasPrice = await this.ethereumProvider.getFeeData().then(fee => fee.gasPrice);
        const gasCost = gasEstimate * gasPrice;
        
        // Calculate total cost
        const totalCost = makerAmount + gasCost;
        
        // Calculate profit margin
        const profitMargin = ((competitiveRate - baseRate) / baseRate) * 100;
        
        return {
            inputAmount: makerAmount,
            outputAmount: ethers.parseEther((Number(ethers.formatEther(makerAmount)) * competitiveRate).toString()),
            gasEstimate: gasEstimate,
            totalCost: totalCost,
            rate: competitiveRate,
            profitMargin: profitMargin,
            profitable: profitMargin > 0
        };
    }

    async placeBid(orderId, bid) {
        try {
            const signer = new ethers.Wallet(this.resolverPrivateKey, this.ethereumProvider);
            const contractWithSigner = this.contract.connect(signer);

            const tx = await contractWithSigner.placeBid(
                orderId,
                bid.inputAmount,
                bid.outputAmount,
                bid.gasEstimate,
                { gasLimit: 300000 }
            );

            await tx.wait();
            console.log(`✅ Bid placed successfully: ${tx.hash}`);

        } catch (error) {
            console.error(`❌ Error placing bid:`, error);
        }
    }

    async considerBidImprovement(orderId, competitorOutput, competitorInput) {
        try {
            const competitorRate = Number(ethers.formatEther(competitorOutput)) / Number(ethers.formatEther(competitorInput));
            
            // Calculate slightly better rate
            const improvedRate = competitorRate * 1.001; // 0.1% better
            
            // Check if improvement is profitable
            const order = await this.contract.getOrder(orderId);
            const baseRate = Number(ethers.formatEther(order.intent.takerAmount)) / Number(ethers.formatEther(order.intent.makerAmount));
            
            const profitMargin = ((improvedRate - baseRate) / baseRate) * 100;
            
            if (profitMargin > this.minProfitMargin) {
                console.log(`🔄 Improving bid: ${improvedRate.toFixed(4)} (${profitMargin.toFixed(2)}% profit)`);
                
                const improvedBid = {
                    inputAmount: order.intent.makerAmount,
                    outputAmount: ethers.parseEther((Number(ethers.formatEther(order.intent.makerAmount)) * improvedRate).toString()),
                    gasEstimate: 250000,
                    totalCost: order.intent.makerAmount + (250000 * (await this.ethereumProvider.getFeeData()).gasPrice),
                    rate: improvedRate,
                    profitMargin: profitMargin,
                    profitable: true
                };
                
                await this.placeBid(orderId, improvedBid);
            }

        } catch (error) {
            console.error(`❌ Error improving bid:`, error);
        }
    }

    async executeWinningSwap(orderId) {
        try {
            console.log(`🚀 Executing winning swap for order ${orderId}...`);

            // Get order details
            const order = await this.contract.getOrder(orderId);
            
            // Generate secret
            const secret = crypto.randomBytes(32);
            const hashlock = ethers.keccak256(secret);

            // Execute cross-chain swap
            if (order.intent.makerToken === ethers.ZeroAddress) {
                // ETH → ALGO
                await this.executeEthToAlgoSwap(orderId, order, secret);
            } else {
                // ALGO → ETH
                await this.executeAlgoToEthSwap(orderId, order, secret);
            }

        } catch (error) {
            console.error(`❌ Error executing winning swap:`, error);
        }
    }

    async executeEthToAlgoSwap(orderId, order, secret) {
        console.log('🔄 Executing ETH → ALGO swap...');

        // 1. Create Algorand HTLC
        const algorandAmount = Number(ethers.formatEther(order.intent.takerAmount));
        await this.createAlgorandHTLC(order.hashlock, algorandAmount, order.timelock);

        // 2. Execute Ethereum side
        const signer = new ethers.Wallet(this.resolverPrivateKey, this.ethereumProvider);
        const contractWithSigner = this.contract.connect(signer);

        // Get our bid index
        const bids = await this.contract.getBids(orderId);
        let ourBidIndex = 0;
        for (let i = 0; i < bids.length; i++) {
            if (bids[i].resolver === this.resolverAddress && bids[i].active) {
                ourBidIndex = i;
                break;
            }
        }

        const tx = await contractWithSigner.selectBestBidAndExecute(
            orderId,
            ourBidIndex,
            secret,
            { gasLimit: 500000 }
        );

        await tx.wait();
        console.log('✅ ETH → ALGO swap executed successfully!');
    }

    async executeAlgoToEthSwap(orderId, order, secret) {
        console.log('🔄 Executing ALGO → ETH swap...');

        // 1. Create Ethereum HTLC
        const signer = new ethers.Wallet(this.resolverPrivateKey, this.ethereumProvider);
        const contractWithSigner = this.contract.connect(signer);

        // Get our bid index
        const bids = await this.contract.getBids(orderId);
        let ourBidIndex = 0;
        for (let i = 0; i < bids.length; i++) {
            if (bids[i].resolver === this.resolverAddress && bids[i].active) {
                ourBidIndex = i;
                break;
            }
        }

        const tx = await contractWithSigner.selectBestBidAndExecute(
            orderId,
            ourBidIndex,
            secret,
            { gasLimit: 500000 }
        );

        await tx.wait();

        // 2. Claim Algorand HTLC
        await this.claimAlgorandHTLC(order.hashlock, secret);

        console.log('✅ ALGO → ETH swap executed successfully!');
    }

    async getCurrentMarketRate() {
        // In a real implementation, this would fetch from DEX APIs
        // For now, return a simulated rate
        return 1500; // 1 ETH = 1500 ALGO
    }

    async estimateGasCosts(orderDetails) {
        // Estimate gas costs for the swap
        const baseGas = 200000;
        const partialFillGas = orderDetails.allowPartialFills ? 50000 : 0;
        return baseGas + partialFillGas;
    }

    async createAlgorandHTLC(hashlock, amount, timelock) {
        // Implementation for creating Algorand HTLC
        console.log(`🔒 Creating Algorand HTLC: ${amount} ALGO`);
        // This would interact with the Algorand contract
    }

    async claimAlgorandHTLC(hashlock, secret) {
        // Implementation for claiming Algorand HTLC
        console.log(`🔓 Claiming Algorand HTLC with secret`);
        // This would interact with the Algorand contract
    }

    async stop() {
        console.log('🛑 Stopping enhanced bidding relayer...');
        this.isRunning = false;
    }

    async start() {
        await this.initialize();
        await this.startBiddingService();
        
        console.log('🏆 ENHANCED BIDDING RELAYER RUNNING');
        console.log('   - Monitoring for new orders');
        console.log('   - Placing competitive bids');
        console.log('   - Executing winning swaps');
        console.log('   - Supporting partial fills');
        console.log('\nPress Ctrl+C to stop\n');

        // Keep the process running
        process.on('SIGINT', async () => {
            await this.stop();
            process.exit(0);
        });
    }
}

// Start the enhanced relayer
async function main() {
    const relayer = new EnhancedBiddingRelayer();
    await relayer.start();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = EnhancedBiddingRelayer; 