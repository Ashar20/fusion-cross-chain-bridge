#!/usr/bin/env node

/**
 * 🌉 COMPLETE ATOMIC SWAP: 0.00005 ETH → ALGO (FIXED VERSION)
 * 
 * Using the FIXED Enhanced1inchStyleBridge with complete bidding mechanism
 * ✅ Real on-chain transactions
 * ✅ Full relayer/resolver architecture with auctions
 * ✅ Complete bidding and execution flow
 * ✅ Verifiable transaction hashes
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');

class CompleteAtomicSwapFixed {
    constructor() {
        console.log('🌉 COMPLETE ATOMIC SWAP (FIXED VERSION)');
        console.log('======================================');
        console.log('✅ Using Fixed Enhanced1inchStyleBridge');
        console.log('✅ Complete Auction & Bidding System');
        console.log('✅ Full Relayer/Resolver Flow');
        console.log('======================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Network configurations
        this.ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-sepolia.public.blastapi.io');
        this.algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        
        // FIXED contract address - newly deployed
        this.contracts = {
            ethereum: {
                address: '0x2879422E4f1418aC2d3852065C913CaF11Db7c56', // NEW FIXED CONTRACT
                abi: [
                    "function createFusionHTLC(address,address,uint256,bytes32,uint256,uint256,string,uint256,uint256,bytes) external payable returns (bytes32)",
                    "function startSimpleAuction(bytes32,uint256) external returns (bytes32)",
                    "function placeBid(bytes32,uint256) external",
                    "function executeFusionHTLCWithInteraction(bytes32,bytes32,bytes32,tuple(address,bytes,uint256)) external",
                    "function setResolverAuthorization(address,bool) external",
                    "function authorizedResolvers(address) external view returns (bool)",
                    "function getCurrentAuctionPrice(bytes32) external view returns (uint256)",
                    "function getHTLC(bytes32) external view returns (tuple)",
                    "function auctions(bytes32) external view returns (tuple)",
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
            ethWallet: new ethers.Wallet(process.env.PRIVATE_KEY || ethers.Wallet.createRandom().privateKey, this.ethProvider),
            algoAccount: algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC || algosdk.generateAccount().mnemonic)
        };
        
        this.relayer = {
            ethWallet: new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY || ethers.Wallet.createRandom().privateKey, this.ethProvider),
            algoAccount: algosdk.mnemonicToSecretKey(process.env.RELAYER_ALGORAND_MNEMONIC || process.env.ALGORAND_MNEMONIC || algosdk.generateAccount().mnemonic)
        };
        
        // Initialize contracts
        this.ethContract = new ethers.Contract(
            this.contracts.ethereum.address,
            this.contracts.ethereum.abi,
            this.user.ethWallet
        );
        
        this.relayerContract = this.ethContract.connect(this.relayer.ethWallet);
        
        // Swap parameters
        this.swapParams = {
            ethAmount: ethers.parseEther('0.00005'), // Exactly 0.00005 ETH
            algoAmount: 50000, // Equivalent in microALGOs (0.05 ALGO)
            secret: crypto.randomBytes(32),
            timelock: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        };
        this.swapParams.hashlock = ethers.keccak256(this.swapParams.secret);
        
        console.log('✅ Fixed Atomic Swap Initialized');
        console.log(`📦 Fixed Contract: ${this.contracts.ethereum.address}`);
        console.log(`👤 User ETH: ${this.user.ethWallet.address}`);
        console.log(`👤 User ALGO: ${this.user.algoAccount.addr}`);
        console.log(`🤖 Relayer ETH: ${this.relayer.ethWallet.address}`);
        console.log(`🤖 Relayer ALGO: ${this.relayer.algoAccount.addr}`);
        console.log(`💰 Swap Amount: 0.00005 ETH → 0.05 ALGO`);
        console.log(`🔑 Secret: ${this.swapParams.secret.toString('hex')}`);
        console.log(`🔒 Hashlock: ${this.swapParams.hashlock}\n`);
    }
    
    async setupResolverAuthorization() {
        console.log('🔧 STEP 0: SETUP RESOLVER AUTHORIZATION');
        console.log('=======================================');
        
        // Authorize relayer as resolver
        const ownerContract = this.ethContract.connect(this.user.ethWallet);
        
        const isAuthorized = await ownerContract.authorizedResolvers(this.relayer.ethWallet.address);
        if (!isAuthorized) {
            console.log('📝 Authorizing relayer as resolver...');
            const authTx = await ownerContract.setResolverAuthorization(this.relayer.ethWallet.address, true);
            await authTx.wait();
            console.log('✅ Relayer authorized as resolver');
        } else {
            console.log('✅ Relayer already authorized');
        }
    }
    
    async createETHHTLC() {
        console.log('\n🔒 STEP 1: CREATE ETH HTLC');
        console.log('==========================');
        console.log('💰 Locking 0.00005 ETH in HTLC...');
        
        try {
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
            
            // Extract HTLC ID from events
            const createEvent = receipt.logs.find(log => {
                try {
                    const decoded = this.ethContract.interface.parseLog(log);
                    return decoded && decoded.name === 'FusionHTLCCreated';
                } catch (e) {
                    return false;
                }
            });
            
            if (!createEvent) {
                throw new Error('HTLC creation event not found');
            }
            
            const decodedEvent = this.ethContract.interface.parseLog(createEvent);
            const htlcId = decodedEvent.args.htlcId;
            
            console.log(`🔑 HTLC ID: ${htlcId}`);
            
            return {
                htlcId: htlcId,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
            
        } catch (error) {
            console.error(`❌ ETH HTLC Creation Failed: ${error.message}`);
            throw error;
        }
    }
    
    async relayerCreateAlgoHTLC(ethHTLC) {
        console.log('\n🤖 STEP 2: RELAYER CREATES ALGO HTLC');
        console.log('====================================');
        console.log('🔄 Creating mirror HTLC on Algorand...');
        
        try {
            const suggestedParams = await this.algoClient.getTransactionParams().do();
            
            const algoHTLCTxn = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.relayer.algoAccount.addr,
                suggestedParams: suggestedParams,
                appIndex: this.contracts.algorand.appId,
                appArgs: [
                    new Uint8Array(Buffer.from('create_htlc', 'utf8')),
                    new Uint8Array(Buffer.from(ethHTLC.htlcId.slice(2), 'hex')),
                    algosdk.decodeAddress(this.user.algoAccount.addr).publicKey,
                    new Uint8Array(Buffer.from(this.swapParams.algoAmount.toString(), 'utf8')),
                    new Uint8Array(Buffer.from(this.swapParams.hashlock.slice(2), 'hex')),
                    new Uint8Array(Buffer.from(this.swapParams.timelock.toString(), 'utf8'))
                ]
            });
            
            const signedAlgoTxn = algoHTLCTxn.signTxn(this.relayer.algoAccount.sk);
            const algoResult = await this.algoClient.sendRawTransaction(signedAlgoTxn).do();
            
            console.log(`📝 ALGO HTLC Transaction: ${algoResult.txId}`);
            console.log(`🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/${algoResult.txId}`);
            
            await algosdk.waitForConfirmation(this.algoClient, algoResult.txId, 4);
            console.log('✅ Algorand HTLC created and confirmed');
            
            return {
                txId: algoResult.txId,
                htlcId: ethHTLC.htlcId
            };
            
        } catch (error) {
            console.error(`❌ Algorand HTLC Creation Failed: ${error.message}`);
            throw error;
        }
    }
    
    async userClaimALGO(algoHTLC) {
        console.log('\n👤 STEP 3: USER CLAIMS ALGO');
        console.log('============================');
        console.log('🔑 User revealing secret to claim ALGO...');
        
        try {
            const suggestedParams = await this.algoClient.getTransactionParams().do();
            
            const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.user.algoAccount.addr,
                suggestedParams: suggestedParams,
                appIndex: this.contracts.algorand.appId,
                appArgs: [
                    new Uint8Array(Buffer.from('claim_htlc', 'utf8')),
                    new Uint8Array(Buffer.from(algoHTLC.htlcId.slice(2), 'hex')),
                    new Uint8Array(this.swapParams.secret)
                ]
            });
            
            const signedClaimTxn = claimTxn.signTxn(this.user.algoAccount.sk);
            const claimResult = await this.algoClient.sendRawTransaction(signedClaimTxn).do();
            
            console.log(`📝 ALGO Claim Transaction: ${claimResult.txId}`);
            console.log(`🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/${claimResult.txId}`);
            
            await algosdk.waitForConfirmation(this.algoClient, claimResult.txId, 4);
            console.log('✅ User successfully claimed ALGO!');
            console.log('🔑 Secret revealed on-chain');
            
            return {
                txId: claimResult.txId,
                secret: this.swapParams.secret.toString('hex')
            };
            
        } catch (error) {
            console.error(`❌ ALGO Claim Failed: ${error.message}`);
            throw error;
        }
    }
    
    async relayerStartAuctionAndBid(ethHTLC) {
        console.log('\n🎯 STEP 4: RELAYER AUCTION & BIDDING');
        console.log('====================================');
        console.log('📊 Starting auction for ETH HTLC...');
        
        try {
            // Start auction
            const auctionTx = await this.relayerContract.startSimpleAuction(ethHTLC.htlcId, 300); // 5 minutes
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
            
            if (!auctionId) {
                throw new Error('Auction ID not found');
            }
            
            console.log(`🎯 Auction ID: ${auctionId}`);
            
            // Get current auction price
            const currentPrice = await this.relayerContract.getCurrentAuctionPrice(auctionId);
            console.log(`💰 Current auction price: ${ethers.formatUnits(currentPrice, 'gwei')} gwei`);
            
            // Place winning bid
            console.log('🏆 Placing winning bid...');
            const bidPrice = currentPrice; // Bid exactly at current price
            const bidTx = await this.relayerContract.placeBid(auctionId, bidPrice);
            const bidReceipt = await bidTx.wait();
            
            console.log(`✅ Winning bid placed: ${bidTx.hash}`);
            console.log(`💎 Bid price: ${ethers.formatUnits(bidPrice, 'gwei')} gwei`);
            
            // Verify auction won event
            for (const log of bidReceipt.logs) {
                try {
                    const decoded = this.relayerContract.interface.parseLog(log);
                    if (decoded && decoded.name === 'AuctionWon') {
                        console.log('🏆 AUCTION WON!');
                        console.log(`   Winner: ${decoded.args.resolver}`);
                        console.log(`   Price: ${ethers.formatUnits(decoded.args.gasPrice, 'gwei')} gwei`);
                        break;
                    }
                } catch (e) {
                    // Skip logs that can't be decoded
                }
            }
            
            return {
                auctionId: auctionId,
                auctionTx: auctionTx.hash,
                bidTx: bidTx.hash,
                bidPrice: bidPrice
            };
            
        } catch (error) {
            console.error(`❌ Auction/Bidding Failed: ${error.message}`);
            throw error;
        }
    }
    
    async relayerExecuteHTLC(ethHTLC, auctionData) {
        console.log('\n⚡ STEP 5: RELAYER EXECUTES HTLC');
        console.log('================================');
        console.log('🔑 Using revealed secret to claim ETH...');
        
        try {
            const interaction = {
                target: ethers.ZeroAddress,
                callData: '0x',
                gasLimit: 0
            };
            
            const executeTx = await this.relayerContract.executeFusionHTLCWithInteraction(
                ethHTLC.htlcId,
                this.swapParams.secret,
                auctionData.auctionId,
                interaction,
                { gasLimit: 500000 }
            );
            
            console.log(`📝 ETH Execution Transaction: ${executeTx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${executeTx.hash}`);
            
            const executeReceipt = await executeTx.wait();
            console.log(`✅ HTLC executed successfully in block ${executeReceipt.blockNumber}`);
            
            // Check for execution events
            for (const log of executeReceipt.logs) {
                try {
                    const decoded = this.relayerContract.interface.parseLog(log);
                    if (decoded && decoded.name === 'HTLCExecuted') {
                        console.log('🎉 HTLC EXECUTION EVENT:');
                        console.log(`   HTLC ID: ${decoded.args.htlcId}`);
                        console.log(`   Resolver: ${decoded.args.resolver}`);
                        console.log(`   Secret: ${decoded.args.secret}`);
                    }
                } catch (e) {
                    // Skip logs that can't be decoded
                }
            }
            
            return {
                txHash: executeTx.hash,
                blockNumber: executeReceipt.blockNumber
            };
            
        } catch (error) {
            console.error(`❌ HTLC Execution Failed: ${error.message}`);
            throw error;
        }
    }
    
    async executeCompleteAtomicSwap() {
        try {
            console.log('🚀 STARTING COMPLETE ATOMIC SWAP (FIXED)');
            console.log('========================================\n');
            
            // Step 0: Setup authorization
            await this.setupResolverAuthorization();
            
            // Step 1: User creates ETH HTLC
            const ethHTLC = await this.createETHHTLC();
            
            // Step 2: Relayer creates mirror ALGO HTLC  
            const algoHTLC = await this.relayerCreateAlgoHTLC(ethHTLC);
            
            // Step 3: User claims ALGO (reveals secret)
            const algoClaim = await this.userClaimALGO(algoHTLC);
            
            // Step 4: Relayer starts auction and wins bid
            const auctionData = await this.relayerStartAuctionAndBid(ethHTLC);
            
            // Step 5: Relayer executes HTLC with revealed secret
            const ethClaim = await this.relayerExecuteHTLC(ethHTLC, auctionData);
            
            console.log('\n🎉 COMPLETE ATOMIC SWAP SUCCESSFUL!');
            console.log('===================================');
            console.log('✅ ETH HTLC created and locked');
            console.log('✅ ALGO HTLC mirrored by relayer');
            console.log('✅ User claimed ALGO (secret revealed)');
            console.log('✅ Relayer won auction');
            console.log('✅ Relayer claimed ETH');
            console.log('✅ All transactions verifiable on-chain');
            
            return {
                success: true,
                transactions: {
                    ethHTLC: ethHTLC,
                    algoHTLC: algoHTLC,
                    algoClaim: algoClaim,
                    auctionData: auctionData,
                    ethClaim: ethClaim
                }
            };
            
        } catch (error) {
            console.error('\n❌ COMPLETE ATOMIC SWAP FAILED');
            console.error('===============================');
            console.error(`Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

// Execute the complete atomic swap
async function main() {
    const atomicSwap = new CompleteAtomicSwapFixed();
    const result = await atomicSwap.executeCompleteAtomicSwap();
    
    if (result.success) {
        console.log('\n🌟 ATOMIC SWAP SUMMARY');
        console.log('======================');
        console.log(`🔗 ETH HTLC: https://sepolia.etherscan.io/tx/${result.transactions.ethHTLC.txHash}`);
        console.log(`🔗 ALGO HTLC: https://testnet.algoexplorer.io/tx/${result.transactions.algoHTLC.txId}`);
        console.log(`🔗 ALGO Claim: https://testnet.algoexplorer.io/tx/${result.transactions.algoClaim.txId}`);
        console.log(`🔗 Auction Start: https://sepolia.etherscan.io/tx/${result.transactions.auctionData.auctionTx}`);
        console.log(`🔗 Winning Bid: https://sepolia.etherscan.io/tx/${result.transactions.auctionData.bidTx}`);
        console.log(`🔗 ETH Claim: https://sepolia.etherscan.io/tx/${result.transactions.ethClaim.txHash}`);
        console.log('\n💎 SWAP DETAILS:');
        console.log('   Amount: 0.00005 ETH → 0.05 ALGO');
        console.log('   Method: Atomic HTLC with Auction System');
        console.log('   Status: 100% Complete & Verified');
        console.log('   Contract: Fixed Enhanced1inchStyleBridge');
    }
    
    process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CompleteAtomicSwapFixed; 
 
 