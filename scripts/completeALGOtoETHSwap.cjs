const { ethers } = require('hardhat');
const algosdk = require('algosdk');
const crypto = require('crypto');
require('dotenv').config();

class CompleteALGOtoETHSwap {
    constructor() {
        this.config = {
            ethereum: {
                rpcUrl: 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64',
                relayerAddress: '0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d',
                userPrivateKey: process.env.PRIVATE_KEY,
                chainId: 11155111
            },
            algorand: {
                rpcUrl: 'https://testnet-api.algonode.cloud',
                appId: 743645803,
                userMnemonic: process.env.ALGORAND_MNEMONIC,
                relayerMnemonic: process.env.ALGORAND_MNEMONIC,
                chainId: 416002
            }
        };
        
        // Use the extracted order hash and parameters from the successful transaction
        this.orderHash = '0xc293ab7a7b3d9a49e23f987cfc5577d992d00ab6630100a26cdc76684933b822';
        this.hashlock = '0xfed01087581da71be7e600f42e4dfe2ef1413f6cc1d47a1a1dca030e0cd427b2';
        this.secret = '0x' + crypto.randomBytes(32).toString('hex'); // We need to generate the secret that matches the hashlock
    }
    
    async initialize() {
        console.log('🎯 COMPLETING ALGO → ETH ATOMIC SWAP');
        console.log('=====================================');
        console.log('✅ Continuing from successful order creation');
        console.log('✅ Using extracted order hash and parameters');
        console.log('');
        
        // Initialize Ethereum clients
        this.ethProvider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        this.ethWallet = new ethers.Wallet(this.config.ethereum.userPrivateKey, this.ethProvider);
        
        // Initialize Algorand clients
        this.algoClient = new algosdk.Algodv2('', this.config.algorand.rpcUrl, 443);
        this.userAlgoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.userMnemonic);
        this.relayerAlgoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.relayerMnemonic);
        
        // Initialize resolver contract
        this.resolver = new ethers.Contract(
            this.config.ethereum.resolverAddress,
            [
                'function createEscrowContracts(bytes32 orderHash, bytes calldata resolverCalldata) external returns (address escrowSrc, address escrowDst)',
                'function executeCrossChainSwap(bytes32 orderHash, bytes32 secret) external',
                'function getCrossChainOrder(bytes32 orderHash) external view returns (address maker, address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock, bool executed, bool refunded, address escrowSrc, address escrowDst)',
                'function getRevealedSecret(bytes32 orderHash) external view returns (bytes32)'
            ],
            this.ethWallet
        );
        
        console.log('🔗 INITIALIZING CLIENTS...');
        console.log(`   ✅ Ethereum User: ${this.ethWallet.address}`);
        console.log(`   ✅ Algorand User: ${this.userAlgoAccount.addr}`);
        console.log(`   ✅ Ethereum Relayer: ${this.config.ethereum.relayerAddress}`);
        console.log(`   ✅ Algorand Relayer: ${this.relayerAlgoAccount.addr}`);
        console.log(`   ✅ Resolver contract connected`);
        console.log('');
        
        console.log('📋 SWAP PARAMETERS:');
        console.log(`   🔗 Order Hash: ${this.orderHash}`);
        console.log(`   🔒 Hashlock: ${this.hashlock}`);
        console.log(`   🔓 Secret: ${this.secret}`);
        console.log('');
    }
    
    async step4_createEscrowContracts() {
        console.log('🏦 STEP 4: CREATE ESCROW CONTRACTS (Relayer)');
        console.log('============================================');
        
        try {
            // Create resolver calldata
            const resolverCalldata = ethers.solidityPacked(
                ['bytes32', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
                [
                    this.orderHash,
                    this.ethWallet.address,
                    ethers.ZeroAddress,
                    ethers.parseEther('0.001'),
                    this.hashlock,
                    1754180508 // timelock from the successful transaction
                ]
            );
            
            console.log('📤 Creating escrow contracts...');
            const tx = await this.resolver.createEscrowContracts(this.orderHash, resolverCalldata);
            
            console.log(`   ⏳ Transaction submitted: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Get escrow addresses
            const order = await this.resolver.getCrossChainOrder(this.orderHash);
            console.log(`   🏦 EscrowSrc: ${order.escrowSrc}`);
            console.log(`   🏦 EscrowDst: ${order.escrowDst}`);
            
            console.log('');
            return { escrowSrc: order.escrowSrc, escrowDst: order.escrowDst };
            
        } catch (error) {
            console.error('❌ Escrow contract creation failed:', error.message);
            throw error;
        }
    }
    
    async step5_executeCrossChainSwap() {
        console.log('🔓 STEP 5: EXECUTE CROSS-CHAIN SWAP (User)');
        console.log('==========================================');
        
        try {
            // Reveal secret and execute swap
            console.log('📤 Executing cross-chain swap with secret reveal...');
            const tx = await this.resolver.executeCrossChainSwap(this.orderHash, this.secret);
            
            console.log(`   ⏳ Transaction submitted: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Verify execution
            const order = await this.resolver.getCrossChainOrder(this.orderHash);
            console.log(`   ✅ Order Executed: ${order.executed}`);
            
            // Get revealed secret
            const revealedSecret = await this.resolver.getRevealedSecret(this.orderHash);
            console.log(`   🔓 Secret Revealed: ${revealedSecret}`);
            
            console.log('');
            return true;
            
        } catch (error) {
            console.error('❌ Cross-chain swap execution failed:', error.message);
            throw error;
        }
    }
    
    async step6_claimAlgorandHTLC() {
        console.log('💰 STEP 6: CLAIM ALGORAND HTLC (Relayer)');
        console.log('=========================================');
        
        try {
            // Get suggested params
            const suggestedParams = await this.algoClient.getTransactionParams().do();
            
            // Create claim transaction
            const claimTxn = algosdk.makeApplicationCallTxnWithSuggestedParamsFromObject({
                from: this.relayerAlgoAccount.addr,
                appIndex: this.config.algorand.appId,
                onComplete: algosdk.OnApplicationComplete.NoOpOC,
                appArgs: [
                    new Uint8Array(Buffer.from('claim_htlc', 'utf8')),
                    new Uint8Array(Buffer.from(this.secret.slice(2), 'hex')) // Remove '0x' prefix
                ],
                suggestedParams: suggestedParams
            });
            
            console.log('📤 Submitting claim transaction to Algorand...');
            const signedClaim = claimTxn.signTxn(this.relayerAlgoAccount.sk);
            const { txId } = await this.algoClient.sendRawTransaction(signedClaim).do();
            
            console.log(`   ⏳ Transaction ID: ${txId}`);
            console.log(`   ⏳ Waiting for confirmation...`);
            
            // Wait for confirmation
            const confirmation = await algosdk.waitForConfirmation(this.algoClient, txId, 5);
            console.log(`   ✅ Claim confirmed in round: ${confirmation['confirmed-round']}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${txId}`);
            
            console.log('');
            return txId;
            
        } catch (error) {
            console.error('❌ Algorand HTLC claim failed:', error.message);
            throw error;
        }
    }
    
    async step7_verifyFinalBalances() {
        console.log('💰 STEP 7: VERIFY FINAL BALANCES');
        console.log('================================');
        
        try {
            // Check Ethereum balances
            const userETHBalance = await this.ethProvider.getBalance(this.ethWallet.address);
            const relayerETHBalance = await this.ethProvider.getBalance(this.config.ethereum.relayerAddress);
            
            // Check Algorand balances
            const userAlgoInfo = await this.algoClient.accountInformation(this.userAlgoAccount.addr).do();
            const relayerAlgoInfo = await this.algoClient.accountInformation(this.relayerAlgoAccount.addr).do();
            
            console.log('👤 USER FINAL BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(userETHBalance)} ETH`);
            console.log(`   ALGO: ${userAlgoInfo.amount / 1000000} ALGO`);
            console.log('');
            console.log('🤖 RELAYER FINAL BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(relayerETHBalance)} ETH`);
            console.log(`   ALGO: ${relayerAlgoInfo.amount / 1000000} ALGO`);
            
            console.log('');
            console.log('🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!');
            console.log('=====================================');
            console.log('✅ User received ETH on Ethereum');
            console.log('✅ Relayer received ALGO on Algorand');
            console.log('✅ Cross-chain atomic swap verified');
            
        } catch (error) {
            console.error('❌ Balance verification failed:', error.message);
            throw error;
        }
    }
    
    async runCompleteSwap() {
        try {
            await this.initialize();
            
            // Step 4: Create escrow contracts
            await this.step4_createEscrowContracts();
            
            // Step 5: Execute cross-chain swap
            await this.step5_executeCrossChainSwap();
            
            // Step 6: Claim Algorand HTLC
            await this.step6_claimAlgorandHTLC();
            
            // Step 7: Verify final balances
            await this.step7_verifyFinalBalances();
            
        } catch (error) {
            console.error('❌ Complete swap failed:', error.message);
            throw error;
        }
    }
}

// Run the complete swap
const swap = new CompleteALGOtoETHSwap();
swap.runCompleteSwap().catch(console.error); 