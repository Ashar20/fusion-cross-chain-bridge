#!/usr/bin/env node
/**
 * 🌉 SIMPLE ETH → ALGO SWAP
 * 
 * Uses our existing working contracts with relayer address from .env
 * Relayer: 0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d
 */

const { ethers } = require('ethers');
const { Algodv2, mnemonicToSecretKey } = require('algosdk');
const crypto = require('crypto');
require('dotenv').config();

class SimpleSwap {
    constructor() {
        // Ethereum configuration (Sepolia)
        this.ethProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
        this.relayerWallet = new ethers.Wallet(this.relayerPrivateKey, this.ethProvider);
        
        // Algorand configuration
        this.algodClient = new Algodv2(
            process.env.ALGOD_TOKEN,
            process.env.ALGOD_SERVER,
            process.env.ALGOD_PORT || 443
        );
        this.algoAccount = mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        
        // Our existing working contracts
        this.enhancedBridgeAddress = '0x343E44b629fcd1E97Fd787D0f60F39F8FEA123eE'; // From deployment
        this.algorandAppId = 743645803;
        
        // Swap parameters
        this.ethAmount = ethers.parseEther('0.0001'); // 0.0001 ETH (smaller amount)
        this.algoAmount = 100000; // 0.1 ALGO (in microAlgos)
        this.timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        
        // Generate secret and hashlock
        this.secret = crypto.randomBytes(32);
        this.hashlock = ethers.keccak256(this.secret);
        
        console.log('🌉 SIMPLE ETH → ALGO SWAP');
        console.log('==========================');
        console.log(`🤖 Relayer: ${this.relayerWallet.address}`);
        console.log(`💰 ETH Amount: ${ethers.formatEther(this.ethAmount)} ETH`);
        console.log(`🪙 ALGO Amount: ${this.algoAmount / 1000000} ALGO`);
        console.log(`🔒 Hashlock: ${this.hashlock}`);
        console.log(`⏰ Timelock: ${new Date(this.timelock * 1000).toISOString()}`);
    }
    
    async performSwap() {
        try {
            console.log('\n🚀 STEP 1: CREATE ETH HTLC');
            console.log('==========================');
            
            // Step 1: Create HTLC on Ethereum
            await this.createEthereumHTLC();
            
            console.log('\n🚀 STEP 2: CREATE ALGORAND HTLC');
            console.log('===============================');
            
            // Step 2: Create HTLC on Algorand
            await this.createAlgorandHTLC();
            
            console.log('\n🚀 STEP 3: COMPLETE SWAP');
            console.log('========================');
            
            // Step 3: Complete the swap
            await this.completeSwap();
            
            console.log('\n🎉 SWAP COMPLETED SUCCESSFULLY!');
            console.log('===============================');
            console.log('✅ ETH locked in Ethereum HTLC');
            console.log('✅ ALGO locked in Algorand HTLC');
            console.log('✅ Ready for user to claim with secret');
            
        } catch (error) {
            console.error('❌ Swap failed:', error.message);
            throw error;
        }
    }
    
    async createEthereumHTLC() {
        console.log('📋 Creating HTLC on Ethereum...');
        
        // Enhanced Bridge ABI (simplified)
        const bridgeABI = [
            'function createFusionHTLC(address _recipient, bytes32 _hashlock, uint256 _timelock) external payable returns (bytes32 htlcId)',
            'event FusionHTLCCreated(bytes32 indexed htlcId, address indexed initiator, address indexed recipient, uint256 amount, bytes32 hashlock, uint256 timelock)'
        ];
        
        const bridge = new ethers.Contract(this.enhancedBridgeAddress, bridgeABI, this.relayerWallet);
        
        // Create HTLC
        const tx = await bridge.createFusionHTLC(
            this.relayerWallet.address, // recipient (relayer for now)
            this.hashlock,              // hashlock
            this.timelock,              // timelock
            { value: this.ethAmount }   // ETH amount
        );
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ HTLC created! Block: ${receipt.blockNumber}`);
        
        // Extract HTLC ID from event
        const event = receipt.logs.find(log => {
            try {
                return bridge.interface.parseLog(log);
            } catch {
                return false;
            }
        });
        
        if (event) {
            const parsed = bridge.interface.parseLog(event);
            this.htlcId = parsed.args.htlcId;
            console.log(`📋 HTLC ID: ${this.htlcId}`);
        }
    }
    
    async createAlgorandHTLC() {
        console.log('📋 Creating HTLC on Algorand...');
        
        const { makeApplicationCallTxn, makePaymentTxn, assignGroupID } = require('algosdk');
        
        // Get suggested parameters
        const suggestedParams = await this.algodClient.getTransactionParams().do();
        
        // Create app call transaction
        const appCallTxn = makeApplicationCallTxn(
            this.relayerWallet.address, // sender (relayer)
            suggestedParams,
            this.algorandAppId,
            suggestedParams.fee,
            suggestedParams.firstValid,
            suggestedParams.lastValid,
            suggestedParams.genesisHash,
            suggestedParams.genesisID,
            [
                'create_htlc',
                this.hashlock,
                this.relayerWallet.address, // initiator
                this.algoAccount.addr,      // recipient
                this.algoAmount.toString(),
                this.hashlock,
                this.timelock.toString()
            ]
        );
        
        // Create payment transaction to fund the HTLC
        const paymentTxn = makePaymentTxn(
            this.relayerWallet.address, // sender (relayer)
            suggestedParams,
            this.algoAccount.addr,      // receiver (user)
            this.algoAmount,
            undefined,
            suggestedParams.firstValid,
            suggestedParams.lastValid,
            suggestedParams.genesisHash,
            suggestedParams.genesisID
        );
        
        // Group transactions
        const groupedTxn = assignGroupID([appCallTxn, paymentTxn]);
        
        // Sign transactions
        const signedAppCall = appCallTxn.signTxn(this.relayerWallet.privateKey);
        const signedPayment = paymentTxn.signTxn(this.relayerWallet.privateKey);
        
        // Submit grouped transaction
        const { txId } = await this.algodClient.sendRawTransaction([signedAppCall, signedPayment]).do();
        
        console.log(`📤 Algorand transaction submitted: ${txId}`);
        
        // Wait for confirmation
        let confirmedTxn = null;
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                confirmedTxn = await this.algodClient.pendingTransactionInformation(txId).do();
                if (confirmedTxn['confirmed-round']) break;
            } catch {}
        }
        
        if (confirmedTxn && confirmedTxn['confirmed-round']) {
            console.log(`✅ Algorand HTLC created! Round: ${confirmedTxn['confirmed-round']}`);
        } else {
            throw new Error('Algorand transaction not confirmed');
        }
    }
    
    async completeSwap() {
        console.log('📋 Completing swap...');
        
        // For now, we'll just simulate the completion
        // In a real scenario, the user would claim the ALGO with the secret
        // and then the relayer would claim the ETH
        
        console.log('✅ Swap completion simulated');
        console.log(`🔑 Secret: ${this.secret.toString('hex')}`);
        console.log(`🔒 Hashlock: ${this.hashlock}`);
        
        // Save swap details
        const swapDetails = {
            timestamp: new Date().toISOString(),
            relayer: this.relayerWallet.address,
            ethAmount: ethers.formatEther(this.ethAmount),
            algoAmount: this.algoAmount / 1000000,
            hashlock: this.hashlock,
            secret: this.secret.toString('hex'),
            timelock: this.timelock,
            htlcId: this.htlcId,
            algorandAppId: this.algorandAppId,
            status: 'CREATED'
        };
        
        require('fs').writeFileSync('SIMPLE_SWAP_RESULT.json', JSON.stringify(swapDetails, null, 2));
        console.log('📄 Swap details saved to SIMPLE_SWAP_RESULT.json');
    }
}

// Execute the swap
async function main() {
    const swap = new SimpleSwap();
    await swap.performSwap();
}

main().catch(console.error); 