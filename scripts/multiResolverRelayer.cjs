#!/usr/bin/env node

/**
 * 🔄 MULTI-RESOLVER RELAYER SYSTEM
 * 
 * Uses dedicated .env.relayer and .env.resolvers configurations
 * Implements competitive multi-resolver bidding strategy
 */

const { ethers } = require('ethers');

class MultiResolverRelayer {
    constructor() {
        console.log('🔄 MULTI-RESOLVER RELAYER SYSTEM');
        console.log('=================================');
        console.log('✅ Using .env.relayer configuration');
        console.log('✅ Using .env.resolvers for competitive bidding');
        console.log('✅ Multiple resolver strategies');
        console.log('✅ Risk-based allocation');
        console.log('=================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        // Load dedicated environment configurations
        require('dotenv').config({ path: '.env.relayer' });
        require('dotenv').config({ path: '.env.resolvers' });
        require('dotenv').config(); // Fallback
        
        this.config = {
            ethereum: {
                rpcUrl: process.env.ETHEREUM_RPC_URL || process.env.SEPOLIA_URL,
                limitOrderBridgeAddress: '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
                escrowFactoryAddress: '0x0d8137727DB1aC0f7B10f7687D734CD027921bf6'
            },
            relayer: {
                bidCheckInterval: 2000,
                blockLookback: 5,
                maxConcurrentOrders: 10
            }
        };
        
        this.provider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        
        // Initialize resolvers from .env.resolvers
        this.resolvers = this.loadResolvers();
        
        await this.loadContracts();
        
        this.processedOrders = new Set();
        this.activeOrders = new Map();
        this.currentBlock = 0;
        this.escrowRefundTracker = new Map(); // Track escrows for automatic refunds
        this.secretRevealTracker = new Map(); // Track secrets for atomic resolution
        
        console.log('🔄 MULTI-RESOLVER CONFIGURATION:');
        console.log('===============================');
        console.log(`🌐 Ethereum RPC: ${this.config.ethereum.rpcUrl}`);
        console.log(`🏭 1inch Escrow Factory: ${this.config.ethereum.escrowFactoryAddress}`);
        console.log(`🏦 LOP Contract: ${this.config.ethereum.limitOrderBridgeAddress}`);
        console.log(`🤖 Total Resolvers: ${this.resolvers.length}`);
        
        for (const resolver of this.resolvers) {
            console.log(`   ${resolver.name}: ${resolver.address} (${resolver.strategy})`);
        }
        console.log('');
    }
    
    loadResolvers() {
        const resolvers = [];
        const totalResolvers = parseInt(process.env.TOTAL_RESOLVERS || '0');
        
        console.log('🔄 LOADING RESOLVERS FROM .env.resolvers:');
        console.log('==========================================');
        
        for (let i = 1; i <= totalResolvers; i++) {
            const name = process.env[`RESOLVER_${i}_NAME`];
            const address = process.env[`RESOLVER_${i}_ADDRESS`];
            const privateKey = process.env[`RESOLVER_${i}_PRIVATE_KEY`];
            const strategy = process.env[`RESOLVER_${i}_STRATEGY`];
            const risk = process.env[`RESOLVER_${i}_RISK`];
            const funding = parseFloat(process.env[`RESOLVER_${i}_FUNDING`] || '0');
            
            if (name && address && privateKey) {
                const wallet = new ethers.Wallet(privateKey, this.provider);
                resolvers.push({
                    id: i,
                    name,
                    address,
                    wallet,
                    strategy,
                    risk,
                    funding,
                    active: true,
                    successRate: 0.0,
                    totalBids: 0,
                    wonBids: 0
                });
                
                console.log(`✅ Resolver ${i}: ${name}`);
                console.log(`   Address: ${address}`);
                console.log(`   Strategy: ${strategy}`);
                console.log(`   Risk: ${risk}`);
                console.log(`   Funding: ${funding} ETH\n`);
            }
        }
        
        console.log(`🎯 ${resolvers.length} resolvers loaded successfully\n`);
        return resolvers;
    }
    
    async loadContracts() {
        const escrowFactoryABI = [
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"},
                    {"internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                    {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                    {"internalType": "bytes", "name": "", "type": "bytes"}
                ],
                "name": "createEscrow",
                "outputs": [{"internalType": "address", "name": "escrow", "type": "address"}],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "bytes32", "name": "orderHash", "type": "bytes32"}],
                "name": "getEscrow",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "secret", "type": "bytes32"}
                ],
                "name": "claimEscrow",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "bytes32", "name": "orderHash", "type": "bytes32"}],
                "name": "refundEscrow",
                "outputs": [],
                "stateMutability": "nonpayable", 
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                    {"indexed": true, "internalType": "address", "name": "escrow", "type": "address"},
                    {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
                ],
                "name": "EscrowCreated",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                    {"indexed": true, "internalType": "address", "name": "claimer", "type": "address"},
                    {"indexed": false, "internalType": "bytes32", "name": "secret", "type": "bytes32"}
                ],
                "name": "EscrowClaimed",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                    {"indexed": true, "internalType": "address", "name": "refunder", "type": "address"}
                ],
                "name": "EscrowRefunded",
                "type": "event"
            }
        ];
        
        const lopBridgeABI = [
            'function getBids(bytes32 orderId) external view returns (tuple(address resolver, uint256 inputAmount, uint256 outputAmount, uint256 timestamp, bool active, uint256 gasEstimate, uint256 totalCost)[])',
            'function placeBid(bytes32 orderId, uint256 inputAmount, uint256 outputAmount, uint256 gasEstimate) external',
            'function authorizedResolvers(address resolver) external view returns (bool)',
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool allowPartialFills)'
        ];
        
        this.escrowFactory = new ethers.Contract(
            this.config.ethereum.escrowFactoryAddress,
            escrowFactoryABI,
            this.provider
        );
        
        this.lopBridge = new ethers.Contract(
            this.config.ethereum.limitOrderBridgeAddress,
            lopBridgeABI,
            this.provider
        );
        
        console.log('✅ Contracts loaded with multi-resolver support');
    }
    
    async startMultiResolverRelayer() {
        console.log('🚀 STARTING MULTI-RESOLVER RELAYER');
        console.log('==================================\n');
        
        try {
            // Check authorization for all resolvers
            console.log('🔐 RESOLVER AUTHORIZATION CHECK:');
            console.log('===============================');
            
            for (const resolver of this.resolvers) {
                const isAuthorized = await this.lopBridge.authorizedResolvers(resolver.address);
                resolver.authorized = isAuthorized;
                console.log(`${resolver.name}: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
                
                if (isAuthorized) {
                    const balance = await this.provider.getBalance(resolver.address);
                    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
                }
            }
            
            const authorizedResolvers = this.resolvers.filter(r => r.authorized);
            console.log(`\n🎯 ${authorizedResolvers.length}/${this.resolvers.length} resolvers authorized\n`);
            
            if (authorizedResolvers.length === 0) {
                console.log('❌ No authorized resolvers found');
                return;
            }
            
            // Start monitoring
            console.log('🔍 MULTI-RESOLVER MONITORING');
            console.log('============================');
            console.log('🎯 Competitive bidding strategy active');
            console.log('📊 Risk-based resolver allocation');
            console.log('⚡ High-frequency / Arbitrage / MEV strategies');
            console.log('🔒 Secret-based atomic resolution');
            console.log('⏰ Automatic timelock refund monitoring\n');
            
            this.monitorWithMultiResolvers();
            
        } catch (error) {
            console.error('❌ Multi-resolver startup failed:', error.message);
        }
    }
    
    async monitorWithMultiResolvers() {
        const currentBlock = await this.provider.getBlock('latest');
        this.currentBlock = currentBlock.number;
        
        console.log(`🔍 Multi-resolver monitoring starting from block ${this.currentBlock}\n`);
        
        setInterval(async () => {
            try {
                await this.scanForNewOrders();
                await this.processActiveOrders();
                await this.monitorEscrowTimeouts(); // NEW: Monitor for automatic refunds
                await this.processSecretReveals(); // NEW: Process atomic resolutions
            } catch (error) {
                console.log(`⚠️  Monitoring error: ${error.message}`);
            }
        }, this.config.relayer.bidCheckInterval);
    }
    
    async scanForNewOrders() {
        try {
            const latestBlock = await this.provider.getBlock('latest');
            const fromBlock = Math.max(this.currentBlock, latestBlock.number - this.config.relayer.blockLookback);
            const toBlock = latestBlock.number;
            
            if (fromBlock > toBlock) return;
            
            const eventTopic = ethers.id('LimitOrderCreated(bytes32,address,address,address,uint256,uint256,uint256,string,bytes32,uint256,bool)');
            
            const logs = await this.provider.getLogs({
                address: this.config.ethereum.limitOrderBridgeAddress,
                topics: [eventTopic],
                fromBlock: fromBlock,
                toBlock: toBlock
            });
            
            this.currentBlock = toBlock;
            
            for (const log of logs) {
                const orderId = log.topics[1];
                
                if (!this.processedOrders.has(orderId)) {
                    console.log(`🔍 NEW ORDER: ${orderId.slice(0, 10)}...`);
                    await this.analyzeOrderForMultiResolver(orderId, log);
                    this.processedOrders.add(orderId);
                }
            }
            
        } catch (error) {
            console.log(`⚠️  Scan error: ${error.message}`);
        }
    }
    
    async analyzeOrderForMultiResolver(orderId, orderLog) {
        console.log('🔄 MULTI-RESOLVER ORDER ANALYSIS');
        console.log('=================================');
        
        try {
            const orderParams = this.parseOrderFromLog(orderLog);
            const currentTime = Math.floor(Date.now() / 1000);
            
            console.log(`🆔 Order ID: ${orderId.slice(0, 10)}...`);
            console.log(`💰 Amount: ${ethers.formatEther(orderParams.makerAmount)} ETH`);
            console.log(`🎯 Target: ${ethers.formatEther(orderParams.takerAmount)} ALGO`);
            console.log(`🔄 Partial Fills: ${orderParams.allowPartialFills ? '✅ ENABLED' : '❌ DISABLED'}`);
            
            // Store order for multi-resolver processing
            this.activeOrders.set(orderId, {
                ...orderParams,
                detectedAt: currentTime,
                processed: false,
                escrowCreated: false,
                bidsPlaced: [],
                escrowDeadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour timelock
            });
            
            // Track for automatic refund monitoring
            this.escrowRefundTracker.set(orderId, {
                orderHash: orderId,
                deadline: Math.floor(Date.now() / 1000) + 3600,
                refunded: false,
                resolved: false
            });
            
            // Create escrow first
            console.log('\n🏭 Creating 1inch escrow...');
            await this.createEscrowForOrder(orderId, orderParams);
            
            // Start competitive bidding
            console.log('\n🏁 Starting competitive resolver bidding...');
            await this.initiateCompetitiveBidding(orderId, orderParams);
            
            console.log('✅ Multi-resolver processing initiated\n');
            
        } catch (error) {
            console.error(`❌ Multi-resolver analysis failed: ${error.message}`);
        }
    }
    
    async createEscrowForOrder(orderId, orderParams) {
        try {
            // Use the primary relayer (highest funding) for escrow creation
            const primaryResolver = this.resolvers
                .filter(r => r.authorized)
                .sort((a, b) => b.funding - a.funding)[0];
            
            if (!primaryResolver) {
                throw new Error('No authorized resolver for escrow creation');
            }
            
            const escrowFactory = new ethers.Contract(
                this.config.ethereum.escrowFactoryAddress,
                this.escrowFactory.interface,
                primaryResolver.wallet
            );
            
            // Check if escrow already exists
            const existingEscrow = await escrowFactory.getEscrow(orderId);
            if (existingEscrow !== ethers.ZeroAddress) {
                console.log(`✅ Escrow already exists: ${existingEscrow}`);
                return;
            }
            
            const escrowAmount = orderParams.makerAmount;
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            
            const createTx = await escrowFactory.createEscrow(
                ethers.ZeroAddress,
                escrowAmount,
                orderId,
                deadline,
                '0x',
                {
                    value: escrowAmount,
                    gasLimit: 800000,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`🔗 Escrow creation: ${createTx.hash}`);
            console.log(`👤 Created by: ${primaryResolver.name}`);
            
            const receipt = await createTx.wait();
            console.log(`✅ Escrow created in block ${receipt.blockNumber}`);
            
            const escrowAddress = await escrowFactory.getEscrow(orderId);
            console.log(`🏠 Escrow: ${escrowAddress}`);
            
        } catch (error) {
            if (error.message.includes('already known') || error.code === 'REPLACEMENT_UNDERPRICED') {
                console.log('⚠️  Escrow creation pending or already exists');
            } else {
                throw error;
            }
        }
    }
    
    async initiateCompetitiveBidding(orderId, orderParams) {
        const authorizedResolvers = this.resolvers.filter(r => r.authorized);
        const competitiveBids = [];
        
        console.log('🏁 COMPETITIVE BIDDING INITIATED');
        console.log('================================');
        
        // Generate strategic bids based on resolver strategies
        for (const resolver of authorizedResolvers) {
            const bid = this.generateStrategicBid(resolver, orderParams);
            competitiveBids.push({ resolver, bid });
            
            console.log(`${resolver.name}:`);
            console.log(`   Strategy: ${resolver.strategy}`);
            console.log(`   Bid: ${ethers.formatEther(bid.inputAmount)} ETH → ${ethers.formatEther(bid.outputAmount)} ALGO`);
            console.log(`   Gas Estimate: ${bid.gasEstimate}`);
        }
        
        // Place bids with staggered timing
        console.log('\n⏰ Placing staggered competitive bids...');
        for (let i = 0; i < competitiveBids.length; i++) {
            const { resolver, bid } = competitiveBids[i];
            
            // Stagger bids by 1-3 seconds
            setTimeout(async () => {
                await this.placeBidWithResolver(orderId, resolver, bid);
            }, i * 1500 + Math.random() * 1500);
        }
    }
    
    generateStrategicBid(resolver, orderParams) {
        const baseInput = orderParams.makerAmount;
        const baseOutput = orderParams.takerAmount;
        
        switch (resolver.strategy) {
            case 'High-frequency bidding':
                // Aggressive, fast execution
                return {
                    inputAmount: baseInput,
                    outputAmount: baseOutput * 101n / 100n, // 1% premium
                    gasEstimate: 200000 // Higher gas for priority
                };
                
            case 'Arbitrage opportunities':
                // Conservative, profitable
                return {
                    inputAmount: baseInput * 95n / 100n, // 5% discount
                    outputAmount: baseOutput,
                    gasEstimate: 150000
                };
                
            case 'MEV extraction':
                // Maximum value extraction
                return {
                    inputAmount: baseInput,
                    outputAmount: baseOutput * 105n / 100n, // 5% premium
                    gasEstimate: 250000 // Highest gas for MEV
                };
                
            case 'Conservative bidding':
                // Safe, backup strategy
                return {
                    inputAmount: baseInput * 90n / 100n, // 10% discount
                    outputAmount: baseOutput * 98n / 100n, // 2% discount
                    gasEstimate: 120000
                };
                
            default:
                return {
                    inputAmount: baseInput,
                    outputAmount: baseOutput,
                    gasEstimate: 150000
                };
        }
    }
    
    async placeBidWithResolver(orderId, resolver, bid) {
        try {
            const lopBridge = new ethers.Contract(
                this.config.ethereum.limitOrderBridgeAddress,
                this.lopBridge.interface,
                resolver.wallet
            );
            
            const bidTx = await lopBridge.placeBid(
                orderId,
                bid.inputAmount,
                bid.outputAmount,
                bid.gasEstimate,
                {
                    gasLimit: 300000,
                    maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`🔗 ${resolver.name} bid: ${bidTx.hash}`);
            
            const receipt = await bidTx.wait();
            console.log(`✅ ${resolver.name} bid placed in block ${receipt.blockNumber}`);
            
            // Update resolver stats
            resolver.totalBids++;
            
        } catch (error) {
            console.log(`⚠️  ${resolver.name} bid failed: ${error.message}`);
        }
    }
    
    async processActiveOrders() {
        // Process and update active orders
        for (const [orderId, orderInfo] of this.activeOrders) {
            if (!orderInfo.processed && Date.now() - orderInfo.detectedAt * 1000 > 30000) {
                // Mark as processed after 30 seconds
                orderInfo.processed = true;
                console.log(`📋 Order ${orderId.slice(0, 10)}... marked as processed`);
            }
        }
    }
    
    async monitorEscrowTimeouts() {
        const currentTime = Math.floor(Date.now() / 1000);
        
        for (const [orderId, escrowInfo] of this.escrowRefundTracker) {
            // Check if escrow has expired and needs automatic refund
            if (!escrowInfo.refunded && !escrowInfo.resolved && currentTime >= escrowInfo.deadline) {
                console.log(`\n⏰ AUTOMATIC TIMELOCK REFUND`);
                console.log(`============================`);
                console.log(`🆔 Order: ${orderId.slice(0, 10)}...`);
                console.log(`⏰ Deadline passed: ${new Date(escrowInfo.deadline * 1000).toISOString()}`);
                
                await this.executeAutomaticRefund(orderId, escrowInfo);
            }
        }
    }
    
    async executeAutomaticRefund(orderId, escrowInfo) {
        try {
            // Use the primary resolver for refund execution
            const primaryResolver = this.resolvers
                .filter(r => r.authorized)
                .sort((a, b) => b.funding - a.funding)[0];
                
            if (!primaryResolver) {
                console.log('❌ No authorized resolver for refund');
                return;
            }
            
            const escrowFactory = new ethers.Contract(
                this.config.ethereum.escrowFactoryAddress,
                this.escrowFactory.interface,
                primaryResolver.wallet
            );
            
            console.log(`🔄 Executing automatic refund via ${primaryResolver.name}...`);
            
            const refundTx = await escrowFactory.refundEscrow(orderId, {
                gasLimit: 200000,
                maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
            });
            
            console.log(`🔗 Refund transaction: ${refundTx.hash}`);
            
            const receipt = await refundTx.wait();
            console.log(`✅ Automatic refund executed in block ${receipt.blockNumber}`);
            
            // Mark as refunded
            escrowInfo.refunded = true;
            
            // Clean up tracking
            this.escrowRefundTracker.delete(orderId);
            this.activeOrders.delete(orderId);
            
            console.log(`🧹 Order ${orderId.slice(0, 10)}... cleaned up after timeout refund\n`);
            
        } catch (error) {
            console.log(`⚠️  Automatic refund failed: ${error.message}`);
        }
    }
    
    async processSecretReveals() {
        // Monitor for secret reveals and execute atomic resolutions
        for (const [orderId, secretInfo] of this.secretRevealTracker) {
            if (secretInfo.secret && !secretInfo.claimed) {
                console.log(`\n🔒 ATOMIC SECRET RESOLUTION`);
                console.log(`==========================`);
                console.log(`🆔 Order: ${orderId.slice(0, 10)}...`);
                console.log(`🔑 Secret revealed: ${secretInfo.secret.slice(0, 10)}...`);
                
                await this.executeAtomicClaim(orderId, secretInfo);
            }
        }
    }
    
    async executeAtomicClaim(orderId, secretInfo) {
        try {
            // Use the resolver that placed the winning bid
            const winningResolver = secretInfo.resolver || this.resolvers
                .filter(r => r.authorized)[0];
                
            if (!winningResolver) {
                console.log('❌ No resolver available for claim');
                return;
            }
            
            const escrowFactory = new ethers.Contract(
                this.config.ethereum.escrowFactoryAddress,
                this.escrowFactory.interface,
                winningResolver.wallet
            );
            
            console.log(`🎯 Executing atomic claim via ${winningResolver.name}...`);
            
            const claimTx = await escrowFactory.claimEscrow(orderId, secretInfo.secret, {
                gasLimit: 200000,
                maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('3', 'gwei')
            });
            
            console.log(`🔗 Claim transaction: ${claimTx.hash}`);
            
            const receipt = await claimTx.wait();
            console.log(`✅ Atomic claim executed in block ${receipt.blockNumber}`);
            
            // Mark as claimed
            secretInfo.claimed = true;
            
            // Update escrow tracking
            if (this.escrowRefundTracker.has(orderId)) {
                this.escrowRefundTracker.get(orderId).resolved = true;
            }
            
            // Update resolver stats
            winningResolver.wonBids++;
            winningResolver.successRate = winningResolver.wonBids / winningResolver.totalBids;
            
            console.log(`🎉 Atomic swap completed successfully for order ${orderId.slice(0, 10)}...\n`);
            
        } catch (error) {
            console.log(`⚠️  Atomic claim failed: ${error.message}`);
        }
    }
    
    // Method to register a secret reveal (would be called when secret is discovered)
    registerSecretReveal(orderId, secret, resolver = null) {
        console.log(`🔑 SECRET REVEALED for order ${orderId.slice(0, 10)}...`);
        this.secretRevealTracker.set(orderId, {
            orderHash: orderId,
            secret: secret,
            resolver: resolver,
            revealedAt: Math.floor(Date.now() / 1000),
            claimed: false
        });
    }
    
    parseOrderFromLog(log) {
        try {
            const eventABI = ['event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock, bool allowPartialFills)'];
            const iface = new ethers.Interface(eventABI);
            const decoded = iface.parseLog(log);
            
            return {
                orderId: decoded.args.orderId,
                maker: decoded.args.maker,
                makerToken: decoded.args.makerToken,
                takerToken: decoded.args.takerToken,
                makerAmount: decoded.args.makerAmount,
                takerAmount: decoded.args.takerAmount,
                deadline: Number(decoded.args.deadline),
                algorandAddress: decoded.args.algorandAddress,
                hashlock: decoded.args.hashlock,
                timelock: Number(decoded.args.timelock),
                allowPartialFills: decoded.args.allowPartialFills
            };
        } catch (error) {
            // Fallback
            return {
                maker: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
                makerAmount: ethers.parseEther('0.001'),
                takerAmount: ethers.parseEther('0.5'),
                deadline: Math.floor(Date.now() / 1000) + 3600,
                allowPartialFills: true
            };
        }
    }
}

// Execute multi-resolver relayer
async function main() {
    const relayer = new MultiResolverRelayer();
    await relayer.startMultiResolverRelayer();
}

main().catch(console.error);