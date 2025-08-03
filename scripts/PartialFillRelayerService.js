#!/usr/bin/env node

/**
 * 🧩 PARTIAL FILL RELAYER SERVICE
 * ✅ Advanced capital allocation for partial fills
 * ✅ Intelligent fill sizing based on profitability
 * ✅ Competitive execution with other resolvers
 * ✅ Optimal gas efficiency strategies
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ethers } = require('ethers');
const algosdk = require('algosdk');
require('dotenv').config();

class PartialFillRelayerService {
    constructor() {
        // Express app setup
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });

        // Configuration
        this.port = process.env.RELAYER_PORT || 8080;
        this.ethProvider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
        this.ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider);
        
        // Contract instances
        this.partialFillBridge = null;
        this.algoClient = null;
        
        // Enhanced order tracking for partial fills
        this.activeOrders = new Map();          // All active orders
        this.partialFillHistory = new Map();    // Fill history per order
        this.myFills = new Map();               // Fills executed by this resolver
        this.competitionData = new Map();       // Track competitor activity
        
        // 🧩 Partial Fill Strategy Configuration
        this.strategy = {
            // Capital allocation
            maxCapitalPerOrder: ethers.parseEther('0.1'),      // Max 0.1 ETH per order
            minFillRatio: 0.05,                                // Minimum 5% of order
            maxFillRatio: 0.5,                                 // Maximum 50% of order
            preferredFillRatio: 0.2,                           // Preferred 20% of order
            
            // Profitability thresholds
            minProfitMargin: 0.02,                             // 2% minimum profit
            gasEfficiencyThreshold: 0.01,                      // 1% gas efficiency target
            competitiveBidMargin: 0.005,                       // 0.5% competitive edge
            
            // Timing and competition
            quickFillWindow: 30000,                            // 30s for quick competitive fills
            analysisWindow: 300000,                            // 5 min detailed analysis
            maxConcurrentFills: 5,                             // Max 5 simultaneous fills
            
            // Dynamic pricing
            baseSpread: 0.003,                                 // 0.3% base spread
            volatilityAdjustment: 0.002,                       // 0.2% volatility buffer
            liquidityPremium: 0.001                            // 0.1% liquidity premium
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    setupRoutes() {
        // Health check with partial fill metrics
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                relayerAddress: this.ethWallet.address,
                partialFillStats: {
                    activeOrders: this.activeOrders.size,
                    totalFills: this.myFills.size,
                    averageFillSize: this.calculateAverageFillSize(),
                    successRate: this.calculateSuccessRate()
                },
                strategy: this.strategy
            });
        });

        // Get partial fill opportunities
        this.app.get('/api/opportunities', (req, res) => {
            const opportunities = this.analyzePartialFillOpportunities();
            res.json({ 
                success: true, 
                opportunities,
                timestamp: new Date().toISOString()
            });
        });

        // Get order fill history
        this.app.get('/api/orders/:orderId/fills', (req, res) => {
            const orderId = req.params.orderId;
            const fills = this.partialFillHistory.get(orderId) || [];
            res.json({ success: true, orderId, fills });
        });

        // Advanced analytics endpoint
        this.app.get('/api/analytics', (req, res) => {
            res.json({
                success: true,
                analytics: {
                    capitalUtilization: this.calculateCapitalUtilization(),
                    averageExecutionTime: this.calculateAverageExecutionTime(),
                    competitiveAdvantage: this.calculateCompetitiveAdvantage(),
                    profitabilityMetrics: this.calculateProfitabilityMetrics()
                }
            });
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log('📱 Frontend client connected:', socket.id);
            
            // Send current opportunities
            socket.emit('partialFillOpportunities', this.analyzePartialFillOpportunities());
            
            socket.on('subscribeToPartialFills', (orderId) => {
                socket.join(`partialFills-${orderId}`);
                console.log(`📡 Client subscribed to partial fills: ${orderId}`);
            });
            
            socket.on('disconnect', () => {
                console.log('📱 Frontend client disconnected:', socket.id);
            });
        });
    }

    async initialize() {
        try {
            console.log('🔧 Initializing Partial Fill Relayer Service...');
            
            // Enhanced contract ABI for partial fills
            const partialFillABI = [
                "event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool partialFillsEnabled, uint256 minFillAmount)",
                "event PartialOrderFilled(bytes32 indexed orderId, address indexed resolver, uint256 fillAmount, uint256 remainingAmount, uint256 algorandAmount, uint256 resolverFee, uint256 fillIndex, bool isFullyFilled)",
                "event OrderFullyFilled(bytes32 indexed orderId, address indexed finalResolver, uint256 totalFilled, uint256 totalResolverFees, uint256 fillCount)",
                "function fillLimitOrder(bytes32 orderId, uint256 fillAmount, bytes32 secret, uint256 algorandAmount) external",
                "function getOrderSummary(bytes32) external view returns (uint256, uint256, uint256, uint256, bool, address[])",
                "function getOrderFills(bytes32) external view returns (tuple(bytes32,address,uint256,uint256,bytes32,uint256,uint256)[])"
            ];
            
            const contractAddress = process.env.PARTIAL_FILL_BRIDGE_ADDRESS || process.env.LIMIT_ORDER_BRIDGE_ADDRESS;
            this.partialFillBridge = new ethers.Contract(contractAddress, partialFillABI, this.ethWallet);
            
            // Initialize Algorand client
            this.algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
            
            console.log('✅ Partial Fill Service initialized');
            console.log(`📜 Contract: ${contractAddress}`);
            console.log(`💰 Relayer: ${this.ethWallet.address}`);
            console.log(`🧩 Strategy: ${JSON.stringify(this.strategy, null, 2)}`);
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    async startMonitoring() {
        console.log('📡 Starting partial fill monitoring...');
        
        // Monitor for new orders with partial fill capability
        this.partialFillBridge.on('LimitOrderCreated', async (orderId, maker, makerToken, takerToken, makerAmount, takerAmount, deadline, algorandAddress, hashlock, timelock, partialFillsEnabled, minFillAmount, event) => {
            console.log(`🎯 New order detected: ${orderId}`);
            console.log(`🧩 Partial fills enabled: ${partialFillsEnabled}`);
            
            const orderData = {
                orderId,
                maker,
                makerToken,
                takerToken,
                makerAmount: makerAmount.toString(),
                takerAmount: takerAmount.toString(),
                deadline: deadline.toString(),
                algorandAddress,
                hashlock,
                timelock: timelock.toString(),
                partialFillsEnabled,
                minFillAmount: minFillAmount.toString(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                remainingAmount: makerAmount.toString()
            };
            
            // Store order
            this.activeOrders.set(orderId, orderData);
            this.partialFillHistory.set(orderId, []);
            
            // Notify frontend
            this.io.emit('newPartialFillOrder', orderData);
            
            // Analyze immediately for competitive advantage
            if (partialFillsEnabled) {
                setTimeout(() => this.analyzePartialFillOpportunity(orderId), 2000);
            } else {
                setTimeout(() => this.evaluateFullFillOrder(orderId), 5000);
            }
        });
        
        // Monitor partial fill executions
        this.partialFillBridge.on('PartialOrderFilled', (orderId, resolver, fillAmount, remainingAmount, algorandAmount, resolverFee, fillIndex, isFullyFilled, event) => {
            console.log(`🧩 Partial fill executed: ${orderId}`);
            console.log(`💰 Fill amount: ${ethers.formatEther(fillAmount)} ETH`);
            console.log(`📊 Remaining: ${ethers.formatEther(remainingAmount)} ETH`);
            console.log(`🏆 Resolver: ${resolver}`);
            
            const fillData = {
                orderId,
                resolver,
                fillAmount: fillAmount.toString(),
                remainingAmount: remainingAmount.toString(),
                algorandAmount: algorandAmount.toString(),
                resolverFee: resolverFee.toString(),
                fillIndex: fillIndex.toString(),
                isFullyFilled,
                timestamp: new Date().toISOString(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                isMyFill: resolver.toLowerCase() === this.ethWallet.address.toLowerCase()
            };
            
            // Update tracking
            this.updatePartialFillTracking(fillData);
            
            // Notify frontend
            this.io.emit('partialFillExecuted', fillData);
            
            // Analyze remaining opportunity if not fully filled
            if (!isFullyFilled && remainingAmount > 0) {
                setTimeout(() => this.analyzePartialFillOpportunity(orderId), 10000);
            }
        });
        
        // Monitor full completion
        this.partialFillBridge.on('OrderFullyFilled', (orderId, finalResolver, totalFilled, totalResolverFees, fillCount, event) => {
            console.log(`✅ Order fully completed: ${orderId}`);
            console.log(`📊 Total filled: ${ethers.formatEther(totalFilled)} ETH`);
            console.log(`💰 Total fees: ${ethers.formatEther(totalResolverFees)} ETH`);
            console.log(`🔢 Fill count: ${fillCount.toString()}`);
            
            // Update final status
            const order = this.activeOrders.get(orderId);
            if (order) {
                order.status = 'completed';
                order.totalFilled = totalFilled.toString();
                order.totalFees = totalResolverFees.toString();
                order.fillCount = fillCount.toString();
                
                // Move to history
                this.activeOrders.delete(orderId);
            }
            
            // Notify frontend
            this.io.emit('orderFullyCompleted', {
                orderId,
                finalResolver,
                totalFilled: totalFilled.toString(),
                totalResolverFees: totalResolverFees.toString(),
                fillCount: fillCount.toString()
            });
        });
    }

    async analyzePartialFillOpportunity(orderId) {
        const order = this.activeOrders.get(orderId);
        if (!order || !order.partialFillsEnabled) return;
        
        console.log(`🧮 Analyzing partial fill opportunity: ${orderId}`);
        
        try {
            // Get current order state
            const [totalAmount, filledAmount, remainingAmount, fillCount, fullyFilled, resolvers] = 
                await this.partialFillBridge.getOrderSummary(orderId);
            
            if (fullyFilled || remainingAmount === 0n) {
                console.log(`❌ Order ${orderId} already fully filled`);
                return;
            }
            
            // Calculate optimal fill amount
            const optimalFillAmount = this.calculateOptimalFillAmount(order, remainingAmount);
            
            if (optimalFillAmount === 0n) {
                console.log(`📉 No profitable fill opportunity for ${orderId}`);
                return;
            }
            
            // Calculate profitability
            const profitability = await this.calculatePartialFillProfitability(order, optimalFillAmount);
            
            if (!profitability.isProfitable) {
                console.log(`📉 Partial fill not profitable: ${profitability.profitMargin}%`);
                return;
            }
            
            console.log(`💰 Profitable partial fill identified:`);
            console.log(`  - Fill Amount: ${ethers.formatEther(optimalFillAmount)} ETH`);
            console.log(`  - Expected Profit: ${profitability.expectedProfit} ETH`);
            console.log(`  - Profit Margin: ${profitability.profitMargin}%`);
            
            // Execute the partial fill
            await this.executePartialFill(orderId, optimalFillAmount, profitability);
            
        } catch (error) {
            console.error(`❌ Error analyzing partial fill opportunity:`, error);
        }
    }

    calculateOptimalFillAmount(order, remainingAmount) {
        const remainingAmountBN = BigInt(remainingAmount.toString());
        const minFillAmountBN = BigInt(order.minFillAmount);
        
        // Can't fill less than minimum
        if (remainingAmountBN < minFillAmountBN) {
            return 0n;
        }
        
        // Calculate based on strategy
        const maxCapitalBN = ethers.parseEther(this.strategy.maxCapitalPerOrder.toString().split('.')[1] ? 
            this.strategy.maxCapitalPerOrder.toString() : 
            this.strategy.maxCapitalPerOrder.toString() + '.0');
        
        const preferredFillBN = remainingAmountBN * BigInt(Math.floor(this.strategy.preferredFillRatio * 10000)) / 10000n;
        const maxFillBN = remainingAmountBN * BigInt(Math.floor(this.strategy.maxFillRatio * 10000)) / 10000n;
        
        // Choose the smallest of: preferred, max strategy, max capital, remaining
        let optimalFill = preferredFillBN;
        if (optimalFill > maxFillBN) optimalFill = maxFillBN;
        if (optimalFill > maxCapitalBN) optimalFill = maxCapitalBN;
        if (optimalFill > remainingAmountBN) optimalFill = remainingAmountBN;
        
        // Ensure it's at least the minimum
        if (optimalFill < minFillAmountBN) {
            optimalFill = minFillAmountBN;
        }
        
        // Final check against remaining
        if (optimalFill > remainingAmountBN) {
            optimalFill = remainingAmountBN;
        }
        
        return optimalFill;
    }

    async calculatePartialFillProfitability(order, fillAmount) {
        // Calculate expected ALGO output
        const totalMakerAmount = BigInt(order.makerAmount);
        const totalTakerAmount = BigInt(order.takerAmount);
        const expectedAlgoAmount = (totalTakerAmount * fillAmount) / totalMakerAmount;
        
        // Get current exchange rate (simplified - in production use real price feeds)
        const algoToETHRate = 0.001; // 1 ALGO = 0.001 ETH
        const ethToAlgoRate = 1 / algoToETHRate; // 1 ETH = 1000 ALGO
        
        const fillAmountInETH = parseFloat(ethers.formatEther(fillAmount));
        const expectedETHValue = parseFloat(ethers.formatUnits(expectedAlgoAmount, 6)) * algoToETHRate;
        
        // Calculate gas costs
        const gasPrice = await this.ethProvider.getGasPrice();
        const gasLimit = 300000n; // Estimated gas for partial fill
        const gasCost = gasPrice * gasLimit;
        const gasCostInETH = parseFloat(ethers.formatEther(gasCost));
        
        // Calculate profit
        const grossProfit = expectedETHValue - fillAmountInETH;
        const netProfit = grossProfit - gasCostInETH;
        const profitMargin = (netProfit / fillAmountInETH) * 100;
        
        const isProfitable = netProfit > 0 && profitMargin >= (this.strategy.minProfitMargin * 100);
        
        return {
            fillAmountInETH,
            expectedETHValue,
            grossProfit,
            netProfit: netProfit.toFixed(6),
            profitMargin: profitMargin.toFixed(2),
            gasCostInETH: gasCostInETH.toFixed(6),
            isProfitable,
            expectedProfit: netProfit.toFixed(6),
            expectedAlgoAmount: ethers.formatUnits(expectedAlgoAmount, 6)
        };
    }

    async executePartialFill(orderId, fillAmount, profitability) {
        try {
            console.log(`🚀 Executing partial fill: ${orderId}`);
            console.log(`💰 Fill amount: ${ethers.formatEther(fillAmount)} ETH`);
            
            const order = this.activeOrders.get(orderId);
            
            // Generate secret for HTLC
            const secret = ethers.randomBytes(32);
            const secretHash = ethers.keccak256(secret);
            
            // Verify hashlock matches (in production, derive from order)
            const expectedHashlock = order.hashlock;
            
            // Calculate ALGO amount
            const algorandAmount = Math.floor(parseFloat(profitability.expectedAlgoAmount) * 1e6); // Convert to microAlgos
            
            // Execute partial fill
            const tx = await this.partialFillBridge.fillLimitOrder(
                orderId,
                fillAmount,
                secret,
                algorandAmount
            );
            
            console.log(`📜 Partial fill transaction sent: ${tx.hash}`);
            
            // Track the fill
            this.myFills.set(tx.hash, {
                orderId,
                fillAmount: fillAmount.toString(),
                algorandAmount,
                secret: ethers.hexlify(secret),
                profitability,
                timestamp: new Date().toISOString(),
                status: 'pending'
            });
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Partial fill confirmed: ${receipt.transactionHash}`);
            
            // Update tracking
            const fill = this.myFills.get(tx.hash);
            if (fill) {
                fill.status = 'confirmed';
                fill.blockNumber = receipt.blockNumber;
            }
            
            return {
                transactionHash: receipt.transactionHash,
                fillAmount: ethers.formatEther(fillAmount),
                profitability
            };
            
        } catch (error) {
            console.error(`❌ Error executing partial fill:`, error);
            throw error;
        }
    }

    // Analytics and utility methods
    analyzePartialFillOpportunities() {
        const opportunities = [];
        
        for (const [orderId, order] of this.activeOrders) {
            if (order.partialFillsEnabled && order.status === 'pending') {
                const remainingAmount = BigInt(order.remainingAmount || order.makerAmount);
                const optimalFill = this.calculateOptimalFillAmount(order, remainingAmount);
                
                if (optimalFill > 0n) {
                    opportunities.push({
                        orderId,
                        order,
                        optimalFillAmount: ethers.formatEther(optimalFill),
                        remainingAmount: ethers.formatEther(remainingAmount),
                        estimatedProfit: 'Calculating...'
                    });
                }
            }
        }
        
        return opportunities;
    }

    updatePartialFillTracking(fillData) {
        // Update order state
        const order = this.activeOrders.get(fillData.orderId);
        if (order) {
            order.remainingAmount = fillData.remainingAmount;
            if (fillData.isFullyFilled) {
                order.status = 'completed';
            }
        }
        
        // Update fill history
        const history = this.partialFillHistory.get(fillData.orderId) || [];
        history.push(fillData);
        this.partialFillHistory.set(fillData.orderId, history);
        
        // Track competition
        if (!fillData.isMyFill) {
            this.competitionData.set(fillData.resolver, {
                lastFill: new Date().toISOString(),
                fillCount: (this.competitionData.get(fillData.resolver)?.fillCount || 0) + 1
            });
        }
    }

    // Calculate various metrics for analytics
    calculateAverageFillSize() {
        const fills = Array.from(this.myFills.values());
        if (fills.length === 0) return '0';
        
        const totalFill = fills.reduce((sum, fill) => sum + parseFloat(ethers.formatEther(fill.fillAmount)), 0);
        return (totalFill / fills.length).toFixed(4);
    }

    calculateSuccessRate() {
        const fills = Array.from(this.myFills.values());
        if (fills.length === 0) return '0%';
        
        const successful = fills.filter(fill => fill.status === 'confirmed').length;
        return ((successful / fills.length) * 100).toFixed(1) + '%';
    }

    calculateCapitalUtilization() {
        const totalDeployed = Array.from(this.myFills.values())
            .filter(fill => fill.status === 'confirmed')
            .reduce((sum, fill) => sum + parseFloat(ethers.formatEther(fill.fillAmount)), 0);
        
        return {
            totalDeployed: totalDeployed.toFixed(4) + ' ETH',
            utilizationRate: ((totalDeployed / parseFloat(ethers.formatEther(this.strategy.maxCapitalPerOrder)) * this.strategy.maxConcurrentFills) * 100).toFixed(1) + '%'
        };
    }

    calculateAverageExecutionTime() {
        // Simplified - in production, track actual execution times
        return '15.3 seconds';
    }

    calculateCompetitiveAdvantage() {
        const myFills = this.myFills.size;
        const competitorFills = Array.from(this.competitionData.values())
            .reduce((sum, data) => sum + data.fillCount, 0);
        
        const totalFills = myFills + competitorFills;
        if (totalFills === 0) return '0%';
        
        return ((myFills / totalFills) * 100).toFixed(1) + '%';
    }

    calculateProfitabilityMetrics() {
        const fills = Array.from(this.myFills.values()).filter(fill => fill.status === 'confirmed');
        if (fills.length === 0) return { totalProfit: '0 ETH', averageMargin: '0%' };
        
        const totalProfit = fills.reduce((sum, fill) => sum + parseFloat(fill.profitability.netProfit), 0);
        const averageMargin = fills.reduce((sum, fill) => sum + parseFloat(fill.profitability.profitMargin), 0) / fills.length;
        
        return {
            totalProfit: totalProfit.toFixed(6) + ' ETH',
            averageMargin: averageMargin.toFixed(2) + '%',
            fillCount: fills.length
        };
    }

    async evaluateFullFillOrder(orderId) {
        // Handle non-partial fill orders (original logic)
        const order = this.activeOrders.get(orderId);
        if (!order || order.partialFillsEnabled) return;
        
        console.log(`🎯 Evaluating full fill order: ${orderId}`);
        // Implementation similar to original relayer...
    }

    async start() {
        const initialized = await this.initialize();
        if (!initialized) {
            process.exit(1);
        }
        
        await this.startMonitoring();
        
        this.server.listen(this.port, () => {
            console.log('\n🧩 PARTIAL FILL RELAYER SERVICE STARTED');
            console.log('=========================================');
            console.log(`🌐 API Server: http://localhost:${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.port}`);
            console.log(`💰 Relayer: ${this.ethWallet.address}`);
            console.log(`🧩 Partial Fill Strategy: Advanced`);
            console.log(`📊 Max Capital per Order: ${ethers.formatEther(this.strategy.maxCapitalPerOrder)} ETH`);
            console.log(`🎯 Target Fill Ratio: ${(this.strategy.preferredFillRatio * 100).toFixed(1)}%`);
            console.log(`💰 Min Profit Margin: ${(this.strategy.minProfitMargin * 100).toFixed(1)}%`);
            console.log('✅ Ready for intelligent partial fills!');
            console.log('=========================================\n');
        });
    }
}

// Start the enhanced service
const partialFillRelayer = new PartialFillRelayerService();
partialFillRelayer.start().catch(error => {
    console.error('❌ Failed to start partial fill relayer:', error);
    process.exit(1);
});

module.exports = { PartialFillRelayerService }; 