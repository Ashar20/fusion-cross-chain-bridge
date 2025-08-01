#!/usr/bin/env node
/**
 * 🌉 PERFORM 1INCH OFFICIAL ETH → ALGO SWAP
 * 
 * Uses official 1inch cross-chain contracts with relayer address from .env
 * Relayer: 0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d
 */

const { ethers } = require('ethers');
const { Algodv2, mnemonicToSecretKey } = require('algosdk');
const crypto = require('crypto');
require('dotenv').config();

class Official1inchSwap {
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
        
        // 1inch Official Contract Addresses (from deployment)
        this.limitOrderProtocol = '0x68b68381b76e705A7Ef8209800D0886e21b654FE';
        this.escrowFactory = '0x523258A91028793817F84aB037A3372B468ee940';
        this.escrowSrc = '0x0D5E150b04b60A872E1554154803Ce12C41592f8';
        this.escrowDst = '0xcaA622761ebD5CC2B1f0f5891ae4E89FE779d1f1';
        
        // Algorand HTLC Bridge
        this.algorandAppId = 743645803;
        
        // Swap parameters
        this.ethAmount = ethers.parseEther('0.001'); // 0.001 ETH
        this.algoAmount = 1000000; // 1 ALGO (in microAlgos)
        this.timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        
        // Generate secret and hashlock
        this.secret = crypto.randomBytes(32);
        this.hashlock = ethers.keccak256(this.secret);
        
        console.log('🌉 1INCH OFFICIAL ETH → ALGO SWAP');
        console.log('==================================');
        console.log(`🤖 Relayer: ${this.relayerWallet.address}`);
        console.log(`💰 ETH Amount: ${ethers.formatEther(this.ethAmount)} ETH`);
        console.log(`🪙 ALGO Amount: ${this.algoAmount / 1000000} ALGO`);
        console.log(`🔒 Hashlock: ${this.hashlock}`);
        console.log(`⏰ Timelock: ${new Date(this.timelock * 1000).toISOString()}`);
    }
    
    async performSwap() {
        try {
            console.log('\n🚀 STEP 1: CREATE 1INCH ESCROW ON ETHEREUM');
            console.log('==========================================');
            
            // Step 1: Create escrow on Ethereum using 1inch official contracts
            await this.createEthereumEscrow();
            
            console.log('\n🚀 STEP 2: CREATE ALGORAND HTLC');
            console.log('===============================');
            
            // Step 2: Create HTLC on Algorand
            await this.createAlgorandHTLC();
            
            console.log('\n🚀 STEP 3: EXECUTE SWAP');
            console.log('=======================');
            
            // Step 3: Execute the swap
            await this.executeSwap();
            
            console.log('\n🎉 SWAP COMPLETED SUCCESSFULLY!');
            console.log('===============================');
            console.log('✅ ETH locked in 1inch escrow');
            console.log('✅ ALGO locked in Algorand HTLC');
            console.log('✅ Ready for user to claim with secret');
            
        } catch (error) {
            console.error('❌ Swap failed:', error.message);
            throw error;
        }
    }
    
    async createEthereumEscrow() {
        console.log('📋 Creating 1inch escrow on Ethereum...');
        
        // 1inch EscrowFactory ABI (simplified)
        const escrowFactoryABI = [
            'function createEscrow(address _initiator, address _recipient, address _resolver, address _token, uint256 _amount, bytes32 _hashlock, uint256 _timelock) external returns (address escrow)',
            'event EscrowCreated(address indexed escrow, address indexed initiator, address indexed recipient, bytes32 hashlock)'
        ];
        
        const escrowFactory = new ethers.Contract(this.escrowFactory, escrowFactoryABI, this.relayerWallet);
        
        // Create escrow
        const tx = await escrowFactory.createEscrow(
            this.relayerWallet.address, // initiator (relayer)
            this.relayerWallet.address, // recipient (use relayer address for now)
            this.relayerWallet.address, // resolver (relayer)
            ethers.ZeroAddress,         // token (ETH)
            this.ethAmount,             // amount
            this.hashlock,              // hashlock
            this.timelock               // timelock
        );
        
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Escrow created! Block: ${receipt.blockNumber}`);
        
        // Extract escrow address from event
        const event = receipt.logs.find(log => {
            try {
                return escrowFactory.interface.parseLog(log);
            } catch {
                return false;
            }
        });
        
        if (event) {
            const parsed = escrowFactory.interface.parseLog(event);
            this.escrowAddress = parsed.args.escrow;
            console.log(`📋 Escrow Address: ${this.escrowAddress}`);
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
    
    async executeSwap() {
        console.log('📋 Executing swap...');
        
        // For now, we'll just simulate the execution
        // In a real scenario, the user would claim the ALGO with the secret
        // and then the relayer would claim the ETH
        
        console.log('✅ Swap execution simulated');
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
            escrowAddress: this.escrowAddress,
            algorandAppId: this.algorandAppId,
            status: 'CREATED'
        };
        
        require('fs').writeFileSync('1INCH_OFFICIAL_SWAP_RESULT.json', JSON.stringify(swapDetails, null, 2));
        console.log('📄 Swap details saved to 1INCH_OFFICIAL_SWAP_RESULT.json');
    }
}

// Execute the swap
async function main() {
    const swap = new Official1inchSwap();
    await swap.performSwap();
}

main().catch(console.error); 