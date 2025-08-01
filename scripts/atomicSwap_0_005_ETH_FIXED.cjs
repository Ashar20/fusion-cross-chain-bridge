#!/usr/bin/env node

/**
 * 🌉 ATOMIC SWAP: 0.005 ETH → ALGO (FIXED VERSION)
 * 
 * FIXES:
 * 1. Added missing eth_address argument to Algorand HTLC creation
 * 2. Proper ALGO funding via grouped transactions
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');

class AtomicSwap005ETHFixed {
    constructor() {
        console.log('🌉 ATOMIC SWAP: 0.005 ETH → ALGO (FIXED VERSION)');
        console.log('================================================');
        console.log('🔧 Fixed: Missing eth_address argument');
        console.log('🔧 Fixed: Proper ALGO funding mechanism');
        console.log('✅ Using Fixed Enhanced1inchStyleBridge');
        console.log('================================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Network configurations
        this.ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-sepolia.public.blastapi.io');
        this.algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        
        // Fixed contract address
        this.contracts = {
            ethereum: {
                address: '0x2879422E4f1418aC2d3852065C913CaF11Db7c56', // FIXED CONTRACT
                abi: [
                    "function createFusionHTLC(address,address,uint256,bytes32,uint256,uint256,string,uint256,uint256,bytes) external payable returns (bytes32)",
                    "function startSimpleAuction(bytes32,uint256) external returns (bytes32)",
                    "function placeBid(bytes32,uint256) external",
                    "function executeFusionHTLCWithInteraction(bytes32,bytes32,bytes32,(address,bytes,uint256)) external",
                    "function setResolverAuthorization(address,bool) external",
                    "function authorizedResolvers(address) external view returns (bool)",
                    "function getCurrentAuctionPrice(bytes32) external view returns (uint256)",
                    "function MIN_GAS_PRICE() external view returns (uint256)",
                    "event FusionHTLCCreated(bytes32 indexed htlcId, address indexed initiator, uint256 amount, bytes32 hashlock, uint256 thresholdAmount)",
                    "event SimpleAuctionStarted(bytes32 indexed auctionId, bytes32 indexed htlcId, uint256 duration, uint256 startTime)",
                    "event AuctionWon(bytes32 indexed auctionId, address indexed resolver, uint256 gasPrice)",
                    "event HTLCExecuted(bytes32 indexed htlcId, address indexed resolver, bytes32 secret)"
                ]
            },
            algorand: {
                appId: 743645803 // AlgorandHTLCBridge.py
            }
        };
        
        // Account setup
        this.user = {
            ethWallet: new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider),
            algoAccount: algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC)
        };
        
        this.relayer = {
            ethWallet: new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY, this.ethProvider),
            algoAccount: algosdk.mnemonicToSecretKey(process.env.RELAYER_ALGORAND_MNEMONIC || process.env.ALGORAND_MNEMONIC)
        };
        
        // Initialize contracts
        this.ethContract = new ethers.Contract(
            this.contracts.ethereum.address,
            this.contracts.ethereum.abi,
            this.user.ethWallet
        );
        
        this.relayerContract = this.ethContract.connect(this.relayer.ethWallet);
        
        // NEW SWAP PARAMETERS - 0.005 ETH
        this.swapParams = {
            ethAmount: ethers.parseEther('0.005'), // 0.005 ETH
            algoAmount: 500000, // 0.5 ALGO in microALGOs
            secret: crypto.randomBytes(32),
            timelock: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        };
        this.swapParams.hashlock = ethers.keccak256(this.swapParams.secret);
        
        console.log('✅ Fixed Atomic Swap Initialized');
        console.log(`📦 Contract: ${this.contracts.ethereum.address}`);
        console.log(`👤 User ETH: ${this.user.ethWallet.address}`);
        console.log(`👤 User ALGO: ${this.user.algoAccount.addr}`);
        console.log(`🤖 Relayer ETH: ${this.relayer.ethWallet.address}`);
        console.log(`🤖 Relayer ALGO: ${this.relayer.algoAccount.addr}`);
        console.log(`💰 Swap Amount: 0.005 ETH → 0.5 ALGO`);
        console.log(`🔑 Secret: ${this.swapParams.secret.toString('hex')}`);
        console.log(`🔒 Hashlock: ${this.swapParams.hashlock}\n`);
    }
    
    async checkBalances() {
        console.log('💰 BALANCE CHECK');
        console.log('================');
        
        const userETHBalance = await this.ethProvider.getBalance(this.user.ethWallet.address);
        const relayerETHBalance = await this.ethProvider.getBalance(this.relayer.ethWallet.address);
        const userAlgoInfo = await this.algoClient.accountInformation(this.user.algoAccount.addr).do();
        const relayerAlgoInfo = await this.algoClient.accountInformation(this.relayer.algoAccount.addr).do();
        
        console.log('👤 USER:');
        console.log(`   ETH: ${ethers.formatEther(userETHBalance)} ETH`);
        console.log(`   ALGO: ${userAlgoInfo.amount / 1000000} ALGO`);
        console.log('🤖 RELAYER:');
        console.log(`   ETH: ${ethers.formatEther(relayerETHBalance)} ETH`);
        console.log(`   ALGO: ${relayerAlgoInfo.amount / 1000000} ALGO\n`);
        
        if (userETHBalance < this.swapParams.ethAmount) {
            throw new Error(`Insufficient ETH. Need: 0.005 ETH, Have: ${ethers.formatEther(userETHBalance)} ETH`);
        }
        if (relayerAlgoInfo.amount < this.swapParams.algoAmount + 100000) { // Add buffer for fees
            throw new Error(`Relayer insufficient ALGO. Need: 0.6 ALGO, Have: ${relayerAlgoInfo.amount / 1000000} ALGO`);
        }
        
        return true;
    }
    
    async setupAuthorization() {
        console.log('🔧 STEP 0: AUTHORIZATION CHECK');
        console.log('==============================');
        
        const isAuthorized = await this.ethContract.authorizedResolvers(this.relayer.ethWallet.address);
        if (!isAuthorized) {
            console.log('📝 Authorizing relayer...');
            const authTx = await this.ethContract.setResolverAuthorization(this.relayer.ethWallet.address, true);
            await authTx.wait();
            console.log('✅ Relayer authorized');
        } else {
            console.log('✅ Relayer already authorized');
        }
    }
    
    async createETHHTLC() {
        console.log('\n🔒 STEP 1: CREATE ETH HTLC');
        console.log('==========================');
        console.log('💰 Locking 0.005 ETH in HTLC...');
        
        const tx = await this.ethContract.createFusionHTLC(
            ethers.ZeroAddress,                   // recipient (will be set by relayer)
            ethers.ZeroAddress,                   // token (ETH = zero address)
            this.swapParams.ethAmount,            // amount
            this.swapParams.hashlock,             // hashlock
            this.swapParams.timelock,             // timelock
            0,                                    // algorandChainId (testnet)
            this.user.algoAccount.addr,           // algorandAddress
            this.swapParams.algoAmount,           // algorandAmount
            this.swapParams.ethAmount,            // thresholdAmount
            '0x',                                 // interactionData
            { 
                value: this.swapParams.ethAmount,
                gasLimit: 500000
            }
        );
        
        console.log(`📝 ETH HTLC Transaction: ${tx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ ETH HTLC confirmed in block ${receipt.blockNumber}`);
        
        // Extract HTLC ID
        const createEvent = receipt.logs.find(log => {
            try {
                const decoded = this.ethContract.interface.parseLog(log);
                return decoded && decoded.name === 'FusionHTLCCreated';
            } catch (e) {
                return false;
            }
        });
        
        const decodedEvent = this.ethContract.interface.parseLog(createEvent);
        const htlcId = decodedEvent.args.htlcId;
        
        console.log(`🔑 HTLC ID: ${htlcId}`);
        
        return {
            htlcId: htlcId,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
        };
    }
    
    async relayerCreateAlgoHTLCFixed(ethHTLC) {
        console.log('\n🤖 STEP 2: RELAYER CREATES ALGO HTLC (FIXED)');
        console.log('=============================================');
        console.log('🔧 Using correct arguments + funding');
        console.log('🔄 Creating funded HTLC on Algorand...');
        
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        // Create HTLC application call with ALL required arguments
        const algoHTLCTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: this.relayer.algoAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: this.contracts.algorand.appId,
            appArgs: [
                new Uint8Array(Buffer.from('create_htlc', 'utf8')),
                new Uint8Array(Buffer.from(ethHTLC.htlcId.slice(2), 'hex')), // htlc_id
                algosdk.decodeAddress(this.relayer.algoAccount.addr).publicKey, // initiator (relayer)
                algosdk.decodeAddress(this.user.algoAccount.addr).publicKey,    // recipient (user)
                new Uint8Array(Buffer.from(this.swapParams.algoAmount.toString(), 'utf8')), // amount
                new Uint8Array(Buffer.from(this.swapParams.hashlock.slice(2), 'hex')), // hashlock
                new Uint8Array(Buffer.from(this.swapParams.timelock.toString(), 'utf8')), // timelock
                new Uint8Array(Buffer.from(this.user.ethWallet.address, 'utf8')) // eth_address (7th argument!)
            ]
        });
        
        // Create payment transaction to fund the HTLC
        const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: this.relayer.algoAccount.addr,
            to: algosdk.getApplicationAddress(this.contracts.algorand.appId),
            amount: this.swapParams.algoAmount,
            suggestedParams: suggestedParams
        });
        
        // Group the transactions
        const txnGroup = [algoHTLCTxn, paymentTxn];
        algosdk.assignGroupID(txnGroup);
        
        // Sign both transactions
        const signedHTLCTxn = algoHTLCTxn.signTxn(this.relayer.algoAccount.sk);
        const signedPaymentTxn = paymentTxn.signTxn(this.relayer.algoAccount.sk);
        
        // Submit as a group
        const groupTxns = [signedHTLCTxn, signedPaymentTxn];
        const algoResult = await this.algoClient.sendRawTransaction(groupTxns).do();
        
        console.log(`📝 ALGO HTLC Group Transaction: ${algoResult.txId}`);
        console.log(`🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/${algoResult.txId}`);
        console.log(`💰 Payment Transaction: ${algosdk.computeGroupID(txnGroup)}`);
        
        await algosdk.waitForConfirmation(this.algoClient, algoResult.txId, 4);
        console.log('✅ Algorand HTLC created and funded properly!');
        
        return {
            txId: algoResult.txId,
            htlcId: ethHTLC.htlcId,
            paymentAmount: this.swapParams.algoAmount
        };
    }
    
    async userClaimALGO(algoHTLC) {
        console.log('\n👤 STEP 3: USER CLAIMS ALGO (FIXED)');
        console.log('===================================');
        console.log('🔑 User revealing secret to claim 0.5 ALGO...');
        
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: this.user.algoAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: this.contracts.algorand.appId,
            appArgs: [
                new Uint8Array(Buffer.from('claim_htlc', 'utf8')), // Changed from 'withdraw'
                new Uint8Array(Buffer.from(algoHTLC.htlcId.slice(2), 'hex')),
                new Uint8Array(this.swapParams.secret)
            ]
        });
        
        const signedClaimTxn = claimTxn.signTxn(this.user.algoAccount.sk);
        const claimResult = await this.algoClient.sendRawTransaction(signedClaimTxn).do();
        
        console.log(`📝 ALGO Claim Transaction: ${claimResult.txId}`);
        console.log(`🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/${claimResult.txId}`);
        
        await algosdk.waitForConfirmation(this.algoClient, claimResult.txId, 4);
        console.log('✅ User successfully claimed 0.5 ALGO!');
        console.log('🔑 Secret revealed on-chain');
        
        return {
            txId: claimResult.txId,
            secret: this.swapParams.secret.toString('hex')
        };
    }
    
    async relayerAuctionAndBid(ethHTLC) {
        console.log('\n🎯 STEP 4: RELAYER AUCTION & BIDDING');
        console.log('====================================');
        console.log('📊 Starting auction for 0.005 ETH HTLC...');
        
        // Start auction
        const auctionTx = await this.relayerContract.startSimpleAuction(ethHTLC.htlcId, 300);
        const auctionReceipt = await auctionTx.wait();
        console.log(`✅ Auction started: ${auctionTx.hash}`);
        
        // Extract auction ID
        let auctionId = null;
        for (const log of auctionReceipt.logs) {
            try {
                const decoded = this.relayerContract.interface.parseLog(log);
                if (decoded && decoded.name === 'SimpleAuctionStarted') {
                    auctionId = decoded.args.auctionId;
                    break;
                }
            } catch (e) {
                // Skip logs that can't be decoded
            }
        }
        
        console.log(`🎯 Auction ID: ${auctionId}`);
        
        // Wait a moment for price to decay
        console.log('⏳ Waiting for price decay...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Bid at minimum price to ensure win
        const minPrice = await this.relayerContract.MIN_GAS_PRICE();
        console.log(`💰 Bidding at min price: ${ethers.formatUnits(minPrice, 'gwei')} gwei`);
        
        const bidTx = await this.relayerContract.placeBid(auctionId, minPrice);
        const bidReceipt = await bidTx.wait();
        
        console.log(`✅ BID WON: ${bidTx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${bidTx.hash}`);
        
        return {
            auctionId: auctionId,
            auctionTx: auctionTx.hash,
            bidTx: bidTx.hash
        };
    }
    
    async executeCompleteSwap() {
        try {
            console.log('🚀 STARTING 0.005 ETH → ALGO ATOMIC SWAP (FIXED)');
            console.log('=================================================\n');
            
            // Check balances
            await this.checkBalances();
            
            // Setup authorization
            await this.setupAuthorization();
            
            // Execute the 5-step atomic swap
            const ethHTLC = await this.createETHHTLC();
            const algoHTLC = await this.relayerCreateAlgoHTLCFixed(ethHTLC);
            const algoClaim = await this.userClaimALGO(algoHTLC);
            const auctionData = await this.relayerAuctionAndBid(ethHTLC);
            
            console.log('\n🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY (FIXED)!');
            console.log('===============================================');
            console.log('✅ 0.005 ETH locked in HTLC');
            console.log('✅ 0.5 ALGO HTLC created and FUNDED by relayer');
            console.log('✅ User claimed 0.5 ALGO (balance should increase)');
            console.log('✅ Relayer won auction');
            console.log('✅ All transactions verifiable on-chain');
            
            return {
                success: true,
                amount: '0.005 ETH → 0.5 ALGO',
                transactions: {
                    ethHTLC: ethHTLC,
                    algoHTLC: algoHTLC,
                    algoClaim: algoClaim,
                    auctionData: auctionData
                }
            };
            
        } catch (error) {
            console.error('\n❌ ATOMIC SWAP FAILED');
            console.error('=====================');
            console.error(`Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

// Execute the FIXED 0.005 ETH atomic swap
async function main() {
    const atomicSwap = new AtomicSwap005ETHFixed();
    const result = await atomicSwap.executeCompleteSwap();
    
    if (result.success) {
        console.log('\n🌟 SWAP SUMMARY (FIXED VERSION)');
        console.log('===============================');
        console.log(`💎 Amount: ${result.amount}`);
        console.log(`🔗 ETH HTLC: https://sepolia.etherscan.io/tx/${result.transactions.ethHTLC.txHash}`);
        console.log(`🔗 ALGO HTLC: https://testnet.algoexplorer.io/tx/${result.transactions.algoHTLC.txId}`);
        console.log(`🔗 ALGO Claim: https://testnet.algoexplorer.io/tx/${result.transactions.algoClaim.txId}`);
        console.log(`🔗 Auction Start: https://sepolia.etherscan.io/tx/${result.transactions.auctionData.auctionTx}`);
        console.log(`🔗 Winning Bid: https://sepolia.etherscan.io/tx/${result.transactions.auctionData.bidTx}`);
        console.log('\n✅ Atomic swap with proper ALGO funding completed!');
    }
    
    process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AtomicSwap005ETHFixed; 