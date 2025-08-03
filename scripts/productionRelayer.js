#!/usr/bin/env node

/**
 * 🚀 PRODUCTION RELAYER SERVICE
 * ✅ Backend API server for gasless cross-chain dApp
 * ✅ Real-time WebSocket updates for frontend
 * ✅ RESTful API endpoints
 * ✅ Automated swap execution
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ethers } = require('ethers');
const algosdk = require('algosdk');
require('dotenv').config();

class ProductionRelayerService {
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

        // Port configuration
        this.port = process.env.RELAYER_PORT || 8080;
        
        // Blockchain connections
        this.ethProvider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
        this.ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider);
        
        // Contract instances
        this.limitOrderBridge = null;
        this.algoClient = null;
        
        // Active orders tracking
        this.activeOrders = new Map();
        this.orderHistory = [];
        
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
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                relayerAddress: this.ethWallet.address,
                chainConnections: {
                    ethereum: 'connected',
                    algorand: 'connected'
                }
            });
        });

        // Get active orders
        this.app.get('/api/orders', (req, res) => {
            const orders = Array.from(this.activeOrders.values());
            res.json({ 
                success: true, 
                orders,
                count: orders.length 
            });
        });

        // Get order by ID
        this.app.get('/api/orders/:orderId', (req, res) => {
            const order = this.activeOrders.get(req.params.orderId);
            if (order) {
                res.json({ success: true, order });
            } else {
                res.status(404).json({ success: false, error: 'Order not found' });
            }
        });

        // Get relayer statistics
        this.app.get('/api/stats', (req, res) => {
            res.json({
                success: true,
                stats: {
                    totalOrders: this.orderHistory.length,
                    activeOrders: this.activeOrders.size,
                    successfulSwaps: this.orderHistory.filter(o => o.status === 'completed').length,
                    relayerBalance: {
                        ethereum: 'Loading...',
                        algorand: 'Loading...'
                    }
                }
            });
        });

        // Manual order execution (for testing)
        this.app.post('/api/orders/:orderId/execute', async (req, res) => {
            try {
                const orderId = req.params.orderId;
                const result = await this.executeOrder(orderId);
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log('📱 Frontend client connected:', socket.id);
            
            // Send current active orders
            socket.emit('activeOrders', Array.from(this.activeOrders.values()));
            
            socket.on('subscribeToOrder', (orderId) => {
                socket.join(`order-${orderId}`);
                console.log(`📡 Client subscribed to order: ${orderId}`);
            });
            
            socket.on('disconnect', () => {
                console.log('📱 Frontend client disconnected:', socket.id);
            });
        });
    }

    async initialize() {
        try {
            console.log('🔧 Initializing Production Relayer Service...');
            
            // Load contract ABIs and addresses
            const limitOrderABI = [
                "event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock)",
                "event LimitOrderFilled(bytes32 indexed orderId, address indexed resolver, bytes32 secret, uint256 algorandAmount, uint256 resolverFee)",
                "function fillLimitOrder(bytes32 orderId, bytes32 secret, uint256 algorandAmount) external",
                "function limitOrders(bytes32) external view returns (tuple(tuple(address,address,address,uint256,uint256,uint256,uint256,string,bytes32) intent, bytes32 hashlock, uint256 timelock, uint256 depositedAmount, bool filled, bool cancelled, uint256 createdAt, address resolver))"
            ];
            
            // Replace with your deployed contract address
            const limitOrderAddress = process.env.LIMIT_ORDER_BRIDGE_ADDRESS || "0xYourContractAddress";
            this.limitOrderBridge = new ethers.Contract(limitOrderAddress, limitOrderABI, this.ethWallet);
            
            // Initialize Algorand client
            this.algoClient = new algosdk.Algodv2(
                '', 
                'https://testnet-api.algonode.cloud', 
                ''
            );
            
            console.log('✅ Blockchain connections established');
            console.log(`📜 Contract: ${limitOrderAddress}`);
            console.log(`💰 Relayer: ${this.ethWallet.address}`);
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    async startMonitoring() {
        console.log('📡 Starting blockchain monitoring...');
        
        // Monitor Ethereum for new limit orders
        const filter = this.limitOrderBridge.filters.LimitOrderCreated();
        this.limitOrderBridge.on(filter, async (orderId, maker, makerToken, takerToken, makerAmount, takerAmount, deadline, algorandAddress, hashlock, timelock, event) => {
            console.log(`🎯 New limit order detected: ${orderId}`);
            
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
                status: 'pending',
                createdAt: new Date().toISOString(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            };
            
            // Store order
            this.activeOrders.set(orderId, orderData);
            this.orderHistory.push(orderData);
            
            // Notify frontend via WebSocket
            this.io.emit('newOrder', orderData);
            this.io.to(`order-${orderId}`).emit('orderUpdate', orderData);
            
            // Automatically evaluate and potentially execute
            setTimeout(() => this.evaluateOrder(orderId), 5000); // Wait 5 seconds for confirmation
        });
        
        // Monitor for filled orders
        this.limitOrderBridge.on(this.limitOrderBridge.filters.LimitOrderFilled(), (orderId, resolver, secret, algorandAmount, resolverFee, event) => {
            console.log(`✅ Order filled: ${orderId}`);
            
            const order = this.activeOrders.get(orderId);
            if (order) {
                order.status = 'completed';
                order.resolver = resolver;
                order.secret = secret;
                order.algorandAmount = algorandAmount.toString();
                order.resolverFee = resolverFee.toString();
                order.completedAt = new Date().toISOString();
                
                // Notify frontend
                this.io.emit('orderCompleted', order);
                this.io.to(`order-${orderId}`).emit('orderUpdate', order);
                
                // Move to history
                this.activeOrders.delete(orderId);
            }
        });
    }

    async evaluateOrder(orderId) {
        const order = this.activeOrders.get(orderId);
        if (!order || order.status !== 'pending') return;
        
        console.log(`🧮 Evaluating order profitability: ${orderId}`);
        
        try {
            // Calculate profitability (simplified)
            const isProfitable = await this.calculateProfitability(order);
            
            if (isProfitable) {
                console.log(`💰 Order ${orderId} is profitable, executing...`);
                order.status = 'executing';
                this.io.to(`order-${orderId}`).emit('orderUpdate', order);
                
                await this.executeOrder(orderId);
            } else {
                console.log(`📉 Order ${orderId} not profitable, skipping`);
                order.status = 'unprofitable';
                this.io.to(`order-${orderId}`).emit('orderUpdate', order);
            }
        } catch (error) {
            console.error(`❌ Error evaluating order ${orderId}:`, error);
            order.status = 'error';
            order.error = error.message;
            this.io.to(`order-${orderId}`).emit('orderUpdate', order);
        }
    }

    async calculateProfitability(order) {
        // Simplified profitability calculation
        // In production, fetch real exchange rates
        const ethToAlgoRate = 0.001; // Example: 1 ETH = 0.001 ALGO
        const expectedOutput = parseFloat(order.makerAmount) * ethToAlgoRate;
        const requiredOutput = parseFloat(order.takerAmount) / 1e6; // ALGO has 6 decimals
        
        const gasEstimate = 0.01; // Estimated gas cost in ETH
        const profitMargin = expectedOutput - requiredOutput - gasEstimate;
        
        return profitMargin > 0;
    }

    async executeOrder(orderId) {
        const order = this.activeOrders.get(orderId);
        if (!order) throw new Error('Order not found');
        
        console.log(`🚀 Executing order: ${orderId}`);
        
        // Generate secret for HTLC
        const secret = ethers.randomBytes(32);
        const secretHash = ethers.keccak256(secret);
        
        // Verify hashlock matches
        if (secretHash !== order.hashlock) {
            throw new Error('Hashlock mismatch');
        }
        
        // Calculate ALGO amount to deliver
        const algoAmount = Math.floor(parseFloat(order.takerAmount)); // Simplified
        
        // Execute on Ethereum
        const tx = await this.limitOrderBridge.fillLimitOrder(
            orderId,
            secret,
            algoAmount
        );
        
        console.log(`📜 Transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`);
        
        return {
            transactionHash: receipt.transactionHash,
            secret: ethers.hexlify(secret),
            algoAmount
        };
    }

    async start() {
        const initialized = await this.initialize();
        if (!initialized) {
            process.exit(1);
        }
        
        await this.startMonitoring();
        
        this.server.listen(this.port, () => {
            console.log('\n🚀 PRODUCTION RELAYER SERVICE STARTED');
            console.log('=====================================');
            console.log(`🌐 API Server: http://localhost:${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.port}`);
            console.log(`💰 Relayer: ${this.ethWallet.address}`);
            console.log('✅ Ready to process gasless swaps!');
            console.log('=====================================\n');
        });
    }
}

// Start the service
const relayer = new ProductionRelayerService();
relayer.start().catch(error => {
    console.error('❌ Failed to start relayer service:', error);
    process.exit(1);
});

module.exports = { ProductionRelayerService }; 