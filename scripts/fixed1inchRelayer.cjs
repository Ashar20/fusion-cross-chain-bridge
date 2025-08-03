#!/usr/bin/env node

/**
 * 🔧 FIXED 1INCH ESCROW FACTORY RELAYER
 * 
 * Using correct ABI and function signatures from deployed contract
 */

const { ethers } = require('ethers');

class Fixed1inchRelayer {
    constructor() {
        console.log('🔧 FIXED 1INCH ESCROW FACTORY RELAYER');
        console.log('====================================');
        console.log('✅ Correct ABI from deployment');
        console.log('✅ Fixed function signatures');
        console.log('✅ Proper error handling');
        console.log('====================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        this.config = {
            ethereum: {
                rpcUrl: process.env.SEPOLIA_URL || 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                limitOrderBridgeAddress: '0x384B0011f6E6aA8C192294F36dCE09a3758Df788',
                escrowFactoryAddress: '0x0d8137727DB1aC0f7B10f7687D734CD027921bf6'
            },
            relayer: {
                bidCheckInterval: 3000,
                blockLookback: 5
            }
        };
        
        this.provider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, this.provider);
        
        await this.loadContracts();
        
        this.processedOrders = new Set();
        this.currentBlock = 0;
        
        console.log('🔧 FIXED RELAYER CONFIGURATION:');
        console.log('==============================');
        console.log(`🌐 Ethereum RPC: ${this.config.ethereum.rpcUrl}`);
        console.log(`🏭 1inch Escrow Factory: ${this.config.ethereum.escrowFactoryAddress}`);
        console.log(`🏦 LOP Contract: ${this.config.ethereum.limitOrderBridgeAddress}`);
        console.log(`💰 Relayer: ${this.wallet.address}\n`);
    }
    
    async loadContracts() {
        // CORRECT 1inch Escrow Factory ABI from deployment
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
                "inputs": [{"internalType": "bytes32", "name": "orderHash", "type": "bytes32"}],
                "name": "addressOfEscrowSrc",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "bytes32", "name": "orderHash", "type": "bytes32"},
                    {"indexed": true, "internalType": "address", "name": "escrow", "type": "address"},
                    {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
                    {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "EscrowCreated",
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
            this.wallet
        );
        
        this.lopBridge = new ethers.Contract(
            this.config.ethereum.limitOrderBridgeAddress,
            lopBridgeABI,
            this.wallet
        );
        
        console.log('✅ Contracts loaded with correct ABI');
    }
    
    async startFixedRelayer() {
        console.log('🚀 STARTING FIXED 1INCH RELAYER');
        console.log('===============================\n');
        
        try {
            // Check authorization
            const isAuthorized = await this.lopBridge.authorizedResolvers(this.wallet.address);
            console.log(`🔐 Relayer Authorization: ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
            
            if (!isAuthorized) {
                console.log('❌ Relayer not authorized');
                return;
            }
            
            // Check balance
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`💰 ETH Balance: ${ethers.formatEther(balance)} ETH`);
            
            // Start monitoring
            console.log('\n🔍 MONITORING FOR ORDERS WITH FIXED ESCROW INTEGRATION');
            console.log('====================================================');
            
            this.monitorOrders();
            
        } catch (error) {
            console.error('❌ Fixed relayer startup failed:', error.message);
        }
    }
    
    async monitorOrders() {
        const currentBlock = await this.provider.getBlock('latest');
        this.currentBlock = currentBlock.number;
        
        console.log(`🔍 Fixed monitoring starting from block ${this.currentBlock}\n`);
        
        setInterval(async () => {
            try {
                await this.scanForNewOrders();
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
                    await this.processOrderWithFixedEscrow(orderId);
                    this.processedOrders.add(orderId);
                }
            }
            
        } catch (error) {
            console.log(`⚠️  Scan error: ${error.message}`);
        }
    }
    
    async processOrderWithFixedEscrow(orderId) {
        console.log('🔧 PROCESSING WITH FIXED 1INCH ESCROW');
        console.log('====================================');
        
        try {
            // Check if order already has bids
            const existingBids = await this.lopBridge.getBids(orderId);
            if (existingBids.length > 0) {
                console.log(`ℹ️  Order already has ${existingBids.length} bid(s) - skipping\n`);
                return;
            }
            
            console.log(`🆔 Order ID: ${orderId}`);
            
            // STEP 1: Try to get existing escrow first
            console.log('\n🔍 Checking for existing escrow...');
            try {
                const existingEscrow = await this.escrowFactory.getEscrow(orderId);
                if (existingEscrow !== ethers.ZeroAddress) {
                    console.log(`✅ Escrow already exists: ${existingEscrow}`);
                    console.log('🔄 Skipping escrow creation\n');
                    await this.placeBidDirectly(orderId);
                    return;
                }
            } catch (error) {
                console.log(`⚠️  Could not check existing escrow: ${error.message}`);
            }
            
            // STEP 2: Create new escrow with CORRECT parameters
            console.log('🏭 Creating new escrow with correct ABI...');
            
            const escrowParams = {
                token: ethers.ZeroAddress, // ETH
                amount: ethers.parseEther('0.001'), // 0.001 ETH
                orderHash: orderId,
                deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                data: '0x' // Empty bytes
            };
            
            console.log('📊 Escrow Parameters:');
            console.log(`   Token: ${escrowParams.token} (ETH)`);
            console.log(`   Amount: ${ethers.formatEther(escrowParams.amount)} ETH`);
            console.log(`   Order Hash: ${escrowParams.orderHash}`);
            console.log(`   Deadline: ${new Date(escrowParams.deadline * 1000).toISOString()}`);
            
            // FIXED: Use correct function call with proper parameters
            console.log('\n⏳ Creating escrow via 1inch factory...');
            const createTx = await this.escrowFactory.createEscrow(
                escrowParams.token,
                escrowParams.amount,
                escrowParams.orderHash,
                escrowParams.deadline,
                escrowParams.data,
                {
                    value: escrowParams.amount, // Send ETH with transaction
                    gasLimit: 500000,
                    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                }
            );
            
            console.log(`🔗 Escrow creation tx: ${createTx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${createTx.hash}`);
            
            const receipt = await createTx.wait();
            console.log(`✅ Escrow created in block ${receipt.blockNumber}`);
            
            // Get escrow address
            const escrowAddress = await this.escrowFactory.getEscrow(orderId);
            console.log(`🏠 Escrow address: ${escrowAddress}`);
            
            // STEP 3: Place bid on the order
            console.log('\n💰 Placing bid on order...');
            await this.placeBidDirectly(orderId);
            
            console.log('✅ Fixed escrow processing complete\n');
            
        } catch (error) {
            console.error(`❌ Fixed escrow processing failed: ${error.message}`);
            
            if (error.message.includes('execution reverted')) {
                console.log('\n🔍 REVERT ANALYSIS:');
                console.log('- Check if escrow already exists for this orderHash');
                console.log('- Verify parameters match contract expectations');
                console.log('- Ensure sufficient ETH balance for escrow creation');
                console.log('- Check deadline is in the future');
            }
            console.log('');
        }
    }
    
    async placeBidDirectly(orderId) {
        try {
            const bidTx = await this.lopBridge.placeBid(
                orderId,
                ethers.parseEther('0.001'), // input amount
                ethers.parseEther('0.5'),   // output amount
                150000, // gas estimate
                {
                    gasLimit: 300000,
                    maxFeePerGas: ethers.parseUnits('15', 'gwei'),
                    maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
                }
            );
            
            console.log(`🔗 Bid transaction: ${bidTx.hash}`);
            const receipt = await bidTx.wait();
            console.log(`✅ Bid placed in block ${receipt.blockNumber}`);
            
        } catch (error) {
            console.log(`⚠️  Bid placement failed: ${error.message}`);
        }
    }
}

// Execute fixed relayer
async function main() {
    const relayer = new Fixed1inchRelayer();
    await relayer.startFixedRelayer();
}

main().catch(console.error);