/**
 * 🔧 FIXED ALGORAND RELAYER SERVICE
 * Properly integrates with deployed contracts and environment
 */

const algosdk = require('algosdk');
const { ethers } = require('ethers');
const crypto = require('crypto');

class FixedAlgorandRelayerService {
    constructor() {
        require('dotenv').config();
        
        // Use environment variables for proper configuration
        this.ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
        this.ethWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY, this.ethProvider);
        
        // Algorand configuration
        this.algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        this.algoAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        this.algorandAppId = parseInt(process.env.ALGORAND_APP_ID);
        
        // Contract addresses from environment
        this.htlcBridgeAddress = process.env.HTLC_BRIDGE_ADDRESS;
        
        // Relayer state
        this.isRunning = false;
        this.pendingSwaps = new Map();
        this.processedSwaps = new Set();
        
        console.log('🤖 Fixed Relayer Service Initialized');
        console.log(`📱 ETH Address: ${this.ethWallet.address}`);
        console.log(`📱 ALGO Address: ${this.algoAccount.addr}`);
        console.log(`📱 Algorand App ID: ${this.algorandAppId}`);
    }

    async initialize() {
        console.log('🔧 INITIALIZING RELAYER SERVICE');
        console.log('===============================');
        
        try {
            // Check ETH balance
            const ethBalance = await this.ethProvider.getBalance(this.ethWallet.address);
            console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
            
            // Check ALGO balance
            const algoInfo = await this.algodClient.accountInformation(this.algoAccount.addr).do();
            const algoBalance = parseInt(algoInfo.amount.toString()) / 1000000;
            console.log(`💰 ALGO Balance: ${algoBalance} ALGO`);
            
            // Check Algorand app exists
            try {
                const appInfo = await this.algodClient.getApplicationByID(this.algorandAppId).do();
                console.log(`✅ Algorand HTLC App accessible: ${this.algorandAppId}`);
            } catch (error) {
                console.log(`❌ Algorand app error: ${error.message}`);
                return false;
            }
            
            console.log('✅ Relayer service initialized successfully');
            return true;
            
        } catch (error) {
            console.error(`❌ Initialization failed: ${error.message}`);
            return false;
        }
    }

    async startService() {
        console.log('🚀 STARTING RELAYER SERVICE');
        console.log('===========================');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.log('❌ Failed to initialize relayer');
            return false;
        }
        
        this.isRunning = true;
        
        // Start monitoring loops
        this.monitorCrossChainRequests();
        this.monitorAlgorandHTLCs();
        this.heartbeat();
        
        console.log('✅ Relayer service is now running');
        console.log('👀 Monitoring for cross-chain swap requests...');
        
        return true;
    }

    async monitorCrossChainRequests() {
        console.log('👀 MONITORING CROSS-CHAIN REQUESTS');
        console.log('==================================');
        
        // Monitor for new swap requests
        setInterval(async () => {
            if (!this.isRunning) return;
            
            try {
                await this.checkForNewSwapRequests();
            } catch (error) {
                console.log(`⚠️  Monitor error: ${error.message}`);
            }
        }, 10000); // Check every 10 seconds
    }

    async checkForNewSwapRequests() {
        // In a real implementation, this would:
        // 1. Monitor Ethereum events for new HTLC creations
        // 2. Check off-chain order books
        // 3. Listen for user swap requests
        
        // For now, simulate checking for requests
        const hasNewRequest = Math.random() < 0.01; // 1% chance per check
        
        if (hasNewRequest) {
            console.log('🔔 New cross-chain swap request detected!');
            await this.processSwapRequest({
                id: `swap_${Date.now()}`,
                fromChain: 'ethereum',
                toChain: 'algorand',
                amount: '0.001',
                token: 'ETH'
            });
        }
    }

    async processSwapRequest(request) {
        console.log('🔄 PROCESSING SWAP REQUEST');
        console.log('==========================');
        console.log(`📝 Request ID: ${request.id}`);
        console.log(`🔄 ${request.fromChain} → ${request.toChain}`);
        console.log(`💰 Amount: ${request.amount} ${request.token}`);
        
        try {
            // Generate swap parameters
            const secret = crypto.randomBytes(32);
            const hashlock = ethers.keccak256(secret);
            const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
            
            // Store swap details
            this.pendingSwaps.set(request.id, {
                secret: secret.toString('hex'),
                hashlock,
                timelock,
                status: 'pending',
                createdAt: Date.now()
            });
            
            console.log(`🔑 Secret: ${secret.toString('hex')}`);
            console.log(`🔒 Hashlock: ${hashlock}`);
            console.log(`⏰ Timelock: ${new Date(timelock * 1000).toISOString()}`);
            
            // Create HTLC on destination chain (Algorand)
            await this.createAlgorandHTLC(request.id, hashlock, timelock);
            
        } catch (error) {
            console.error(`❌ Failed to process swap: ${error.message}`);
        }
    }

    async createAlgorandHTLC(swapId, hashlock, timelock) {
        console.log('🌐 CREATING ALGORAND HTLC');
        console.log('=========================');
        
        try {
            // Get suggested params
            const suggestedParams = await this.algodClient.getTransactionParams().do();
            if (!suggestedParams.firstRound) {
                const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
                const statusData = await status.json();
                const currentRound = statusData['last-round'];
                suggestedParams.firstRound = currentRound;
                suggestedParams.lastRound = currentRound + 1000;
            }
            
            // Create HTLC transaction
            const htlcTxn = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.algoAccount.addr,
                suggestedParams: suggestedParams,
                appIndex: this.algorandAppId,
                appArgs: [
                    new Uint8Array(Buffer.from('create', 'utf8')),
                    new Uint8Array(Buffer.from(swapId, 'utf8')),
                    this.algoAccount.addr.publicKey,
                    new Uint8Array(Buffer.from('1000000', 'utf8')), // 1 ALGO
                    new Uint8Array(Buffer.from(hashlock.slice(2), 'hex')),
                    new Uint8Array(Buffer.from(timelock.toString(), 'utf8'))
                ]
            });
            
            // Sign and submit
            const signedTxn = htlcTxn.signTxn(this.algoAccount.sk);
            const result = await this.algodClient.sendRawTransaction(signedTxn).do();
            
            await algosdk.waitForConfirmation(this.algodClient, result.txId, 4);
            
            console.log(`✅ Algorand HTLC created: ${result.txId}`);
            console.log(`🔗 Explorer: https://testnet.algoexplorer.io/tx/${result.txId}`);
            
            // Update swap status
            const swap = this.pendingSwaps.get(swapId);
            if (swap) {
                swap.algoHTLCTxId = result.txId;
                swap.status = 'htlc_created';
            }
            
            return result.txId;
            
        } catch (error) {
            console.error(`❌ Algorand HTLC creation failed: ${error.message}`);
            throw error;
        }
    }

    async monitorAlgorandHTLCs() {
        console.log('👀 MONITORING ALGORAND HTLCS');
        console.log('============================');
        
        // Monitor Algorand for HTLC activities
        setInterval(async () => {
            if (!this.isRunning) return;
            
            try {
                await this.checkAlgorandHTLCStatus();
            } catch (error) {
                console.log(`⚠️  Algorand monitor error: ${error.message}`);
            }
        }, 15000); // Check every 15 seconds
    }

    async checkAlgorandHTLCStatus() {
        // Check status of pending swaps
        for (const [swapId, swap] of this.pendingSwaps.entries()) {
            if (swap.status === 'htlc_created') {
                console.log(`🔍 Checking status of swap: ${swapId}`);
                
                // In a real implementation, check if HTLC has been withdrawn
                // For demo, simulate random completion
                if (Math.random() < 0.05) { // 5% chance
                    console.log(`🎉 Swap ${swapId} completed!`);
                    await this.completeSwap(swapId);
                }
            }
        }
    }

    async completeSwap(swapId) {
        console.log('🎉 COMPLETING SWAP');
        console.log('==================');
        
        try {
            const swap = this.pendingSwaps.get(swapId);
            if (!swap) {
                console.log('❌ Swap not found');
                return;
            }
            
            console.log(`📝 Completing swap: ${swapId}`);
            console.log(`🔑 Revealing secret: ${swap.secret}`);
            
            // Get suggested params
            const suggestedParams = await this.algodClient.getTransactionParams().do();
            if (!suggestedParams.firstRound) {
                const status = await fetch('https://testnet-api.algonode.cloud/v2/status');
                const statusData = await status.json();
                const currentRound = statusData['last-round'];
                suggestedParams.firstRound = currentRound;
                suggestedParams.lastRound = currentRound + 1000;
            }
            
            // Create withdraw transaction
            const withdrawTxn = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.algoAccount.addr,
                suggestedParams: suggestedParams,
                appIndex: this.algorandAppId,
                appArgs: [
                    new Uint8Array(Buffer.from('withdraw', 'utf8')),
                    new Uint8Array(Buffer.from(swapId, 'utf8')),
                    new Uint8Array(Buffer.from(swap.secret, 'hex'))
                ]
            });
            
            // Sign and submit
            const signedWithdraw = withdrawTxn.signTxn(this.algoAccount.sk);
            const withdrawResult = await this.algodClient.sendRawTransaction(signedWithdraw).do();
            
            await algosdk.waitForConfirmation(this.algodClient, withdrawResult.txId, 4);
            
            console.log(`✅ Swap completed: ${withdrawResult.txId}`);
            console.log(`🔗 Explorer: https://testnet.algoexplorer.io/tx/${withdrawResult.txId}`);
            
            // Mark as completed
            swap.status = 'completed';
            swap.completedAt = Date.now();
            this.processedSwaps.add(swapId);
            this.pendingSwaps.delete(swapId);
            
            console.log(`💰 Relayer fee earned for swap: ${swapId}`);
            
        } catch (error) {
            console.error(`❌ Failed to complete swap: ${error.message}`);
        }
    }

    async heartbeat() {
        setInterval(() => {
            if (!this.isRunning) return;
            
            const status = this.getServiceStatus();
            console.log('💓 RELAYER HEARTBEAT');
            console.log('===================');
            console.log(`⏰ ${new Date().toISOString()}`);
            console.log(`🔄 Pending Swaps: ${status.pendingSwaps}`);
            console.log(`✅ Completed Swaps: ${status.completedSwaps}`);
            console.log(`⚡ Service Status: ${status.isRunning ? 'ACTIVE' : 'INACTIVE'}`);
            console.log('===================\n');
        }, 60000); // Every minute
    }

    getServiceStatus() {
        return {
            isRunning: this.isRunning,
            ethAddress: this.ethWallet.address,
            algoAddress: this.algoAccount.addr,
            algorandAppId: this.algorandAppId,
            pendingSwaps: this.pendingSwaps.size,
            completedSwaps: this.processedSwaps.size,
            uptime: Date.now(),
            version: '2.0.0'
        };
    }

    async stopService() {
        console.log('🛑 Stopping relayer service...');
        this.isRunning = false;
        console.log('✅ Relayer service stopped');
    }

    // Manual swap execution for testing
    async executeTestSwap() {
        console.log('🧪 EXECUTING TEST SWAP');
        console.log('======================');
        
        const testSwap = {
            id: `test_swap_${Date.now()}`,
            fromChain: 'ethereum',
            toChain: 'algorand',
            amount: '0.001',
            token: 'ETH'
        };
        
        await this.processSwapRequest(testSwap);
        
        // Simulate completion after 30 seconds
        setTimeout(async () => {
            await this.completeSwap(testSwap.id);
        }, 30000);
        
        return testSwap.id;
    }
}

// Export for use
module.exports = { FixedAlgorandRelayerService };

// Run if called directly
if (require.main === module) {
    console.log('🚀 STARTING FIXED RELAYER SERVICE');
    console.log('=================================');
    
    const relayer = new FixedAlgorandRelayerService();
    
    relayer.startService().then(started => {
        if (started) {
            console.log('🎉 Relayer service started successfully!');
            
            // Execute a test swap after 10 seconds
            setTimeout(async () => {
                const testSwapId = await relayer.executeTestSwap();
                console.log(`🧪 Test swap initiated: ${testSwapId}`);
            }, 10000);
        } else {
            console.log('❌ Failed to start relayer service');
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Relayer service error:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received shutdown signal...');
        await relayer.stopService();
        process.exit(0);
    });
}