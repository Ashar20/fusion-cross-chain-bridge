#!/usr/bin/env node

/**
 * 🎯 ALGO → ETH ATOMIC SWAP TEST WITH BALANCE CHECKING
 * 
 * ✅ Check initial balances (User & Relayer)
 * ✅ Execute complete ALGO → ETH atomic swap
 * ✅ Verify balance increases after swap
 * ✅ Real testnet transactions only
 * ✅ Full Fusion+ architecture validation
 */

const { ethers } = require('hardhat');
const algosdk = require('algosdk');
const crypto = require('crypto');
const fs = require('fs');

class ALGOtoETHAtomicSwapTest {
    constructor() {
        console.log('🎯 ALGO → ETH ATOMIC SWAP TEST WITH BALANCE CHECKING');
        console.log('====================================================');
        console.log('✅ Check initial balances (User & Relayer)');
        console.log('✅ Execute complete ALGO → ETH atomic swap');
        console.log('✅ Verify balance increases after swap');
        console.log('✅ Real testnet transactions only');
        console.log('✅ Full Fusion+ architecture validation');
        console.log('====================================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Configuration
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
                userMnemonic: process.env.ALGORAND_USER_MNEMONIC,
                relayerMnemonic: process.env.ALGORAND_MNEMONIC,
                chainId: 416002
            },
            swap: {
                algoAmount: 0.1 * 1000000, // 0.1 ALGO in microAlgos
                ethAmount: ethers.parseEther('0.0001'), // 0.0001 ETH
                timelock: 600 // 10 minutes
            }
        };
        
        // Initialize clients
        console.log('🔗 INITIALIZING CLIENTS...');
        this.ethProvider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        this.ethWallet = new ethers.Wallet(this.config.ethereum.userPrivateKey, this.ethProvider);
        this.algoClient = new algosdk.Algodv2('', this.config.algorand.rpcUrl, 443);
        
        // Initialize accounts
        this.userAlgoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.userMnemonic);
        this.relayerAlgoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.relayerMnemonic);
        
        console.log(`   ✅ Ethereum: ${this.ethWallet.address}`);
        console.log(`   ✅ Algorand User: ${this.userAlgoAccount.addr}`);
        console.log(`   ✅ Algorand Relayer: ${this.relayerAlgoAccount.addr}`);
        console.log(`   ✅ Ethereum Relayer: ${this.config.ethereum.relayerAddress}`);
        
        // Initialize resolver contract
        this.resolver = new ethers.Contract(
            this.config.ethereum.resolverAddress,
            [
                'function createCrossChainHTLC(address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock, string memory algorandAddress) external payable returns (bytes32)',
                'function createEscrowContracts(bytes32 orderHash, bytes calldata resolverCalldata) external returns (address escrowSrc, address escrowDst)',
                'function executeCrossChainSwap(bytes32 orderHash, bytes32 secret) external',
                'function getCrossChainOrder(bytes32 orderHash) external view returns (address maker, address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock, bool executed, bool refunded, address escrowSrc, address escrowDst)',
                'function getRevealedSecret(bytes32 orderHash) external view returns (bytes32)'
            ],
            this.ethWallet
        );
        
        console.log('   ✅ Resolver contract connected');
        console.log('');
        
        // Generate swap parameters
        this.swapParams = {
            secret: crypto.randomBytes(32),
            hashlock: crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex'),
            timelock: Math.floor(Date.now() / 1000) + this.config.swap.timelock
        };
        
        console.log('🔒 SWAP PARAMETERS:');
        console.log(`   💰 ALGO Amount: ${this.config.swap.algoAmount / 1000000} ALGO`);
        console.log(`   💰 ETH Amount: ${ethers.formatEther(this.config.swap.ethAmount)} ETH`);
        console.log(`   🔒 Hashlock: 0x${this.swapParams.hashlock}`);
        console.log(`   ⏰ Timelock: ${this.swapParams.timelock} (${new Date(this.swapParams.timelock * 1000)})`);
        console.log('');
    }
    
    async checkInitialBalances() {
        console.log('💰 STEP 1: CHECKING INITIAL BALANCES');
        console.log('====================================');
        
        try {
            // Check Ethereum balances
            const userETHBalance = await this.ethProvider.getBalance(this.ethWallet.address);
            const relayerETHBalance = await this.ethProvider.getBalance(this.config.ethereum.relayerAddress);
            
            // Check Algorand balances
            const userAlgoInfo = await this.algoClient.accountInformation(this.userAlgoAccount.addr).do();
            const relayerAlgoInfo = await this.algoClient.accountInformation(this.relayerAlgoAccount.addr).do();
            
            console.log('👤 USER BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(userETHBalance)} ETH`);
            console.log(`   ALGO: ${userAlgoInfo.amount / 1000000} ALGO`);
            console.log('');
            console.log('🤖 RELAYER BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(relayerETHBalance)} ETH`);
            console.log(`   ALGO: ${relayerAlgoInfo.amount / 1000000} ALGO`);
            console.log('');
            
            // Store initial balances for comparison
            this.initialBalances = {
                userETH: userETHBalance,
                userALGO: userAlgoInfo.amount / 1000000,
                relayerETH: relayerETHBalance,
                relayerALGO: relayerAlgoInfo.amount / 1000000
            };
            
            // Verify sufficient balances
            if (userAlgoInfo.amount < this.config.swap.algoAmount + 100000) {
                throw new Error(`Insufficient ALGO. Need: ${(this.config.swap.algoAmount + 100000) / 1000000} ALGO, Have: ${userAlgoInfo.amount / 1000000} ALGO`);
            }
            if (relayerETHBalance < ethers.parseEther('0.01')) {
                throw new Error(`Relayer insufficient ETH for gas. Need: 0.01 ETH, Have: ${ethers.formatEther(relayerETHBalance)} ETH`);
            }
            
            console.log('✅ Initial balance check passed');
            console.log('');
            
            return true;
            
        } catch (error) {
            console.error('❌ Initial balance check failed:', error.message);
            throw error;
        }
    }
    
    async createAlgorandHTLC() {
        console.log('🪙 STEP 2: CREATE ALGORAND HTLC (User)');
        console.log('======================================');
        
        try {
            // Get suggested params
            const suggestedParams = await this.algoClient.getTransactionParams().do();
            
            // Create note with Ethereum target
            const noteString = `ETH_TARGET:${this.ethWallet.address}`;
            const note = new Uint8Array(Buffer.from(noteString, 'utf8'));
            
            // Create payment transaction to HTLC app
            const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from: this.userAlgoAccount.addr,
                to: algosdk.getApplicationAddress(this.config.algorand.appId),
                amount: this.config.swap.algoAmount,
                note: note,
                suggestedParams: suggestedParams
            });
            
            // Create app call transaction
            const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
                from: this.userAlgoAccount.addr,
                appIndex: this.config.algorand.appId,
                onComplete: algosdk.OnApplicationComplete.NoOpOC,
                appArgs: [
                    new Uint8Array(Buffer.from('create_htlc', 'utf8')),
                    new Uint8Array(Buffer.from(this.swapParams.hashlock, 'hex')),
                    new Uint8Array(Buffer.from(this.swapParams.timelock.toString())),
                    new Uint8Array(Buffer.from(this.relayerAlgoAccount.addr)),
                    new Uint8Array(Buffer.from(this.ethWallet.address))
                ],
                suggestedParams: suggestedParams
            });
            
            // Group transactions
            const txnArray = [paymentTxn, appCallTxn];
            algosdk.assignGroupID(txnArray);
            
            // Sign transactions
            const signedPayment = paymentTxn.signTxn(this.userAlgoAccount.sk);
            const signedAppCall = appCallTxn.signTxn(this.userAlgoAccount.sk);
            
            // Submit grouped transaction
            console.log('📤 Submitting grouped transaction to Algorand...');
            const { txId } = await this.algoClient.sendRawTransaction([signedPayment, signedAppCall]).do();
            console.log(`   ⏳ Transaction ID: ${txId}`);
            
            // Wait for confirmation
            console.log('   ⏳ Waiting for confirmation...');
            const confirmedTxn = await algosdk.waitForConfirmation(this.algoClient, txId, 4);
            
            console.log('✅ Algorand HTLC created successfully!');
            console.log(`   🔗 Confirmed in round: ${confirmedTxn['confirmed-round']}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${txId}`);
            console.log('');
            
            this.algoHTLCTxId = txId;
            return txId;
            
        } catch (error) {
            console.error('❌ Algorand HTLC creation failed:', error.message);
            throw error;
        }
    }
    
    async createEthereumOrder() {
        console.log('🔗 STEP 3: CREATE ETHEREUM CROSS-CHAIN ORDER (Relayer)');
        console.log('=====================================================');
        
        try {
            // Create cross-chain HTLC order
            console.log('📤 Creating cross-chain HTLC order...');
            const tx = await this.resolver.createCrossChainHTLC(
                ethers.ZeroAddress, // ETH token
                this.config.swap.ethAmount,
                this.ethWallet.address, // User receives ETH
                `0x${this.swapParams.hashlock}`,
                this.swapParams.timelock,
                this.userAlgoAccount.addr, // Algorand address
                { value: this.config.swap.ethAmount }
            );
            
            console.log(`   ⏳ Transaction submitted: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Extract order hash from event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.resolver.interface.parseLog(log);
                    return parsed.name === 'CrossChainOrderCreated';
                } catch {
                    return false;
                }
            });
            
            if (event) {
                const parsed = this.resolver.interface.parseLog(event);
                this.orderHash = parsed.args.orderHash;
                console.log(`   🔗 Order Hash: ${this.orderHash}`);
            } else {
                throw new Error('CrossChainOrderCreated event not found');
            }
            
            console.log('');
            return this.orderHash;
            
        } catch (error) {
            console.error('❌ Ethereum order creation failed:', error.message);
            throw error;
        }
    }
    
    async createEscrowContracts() {
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
                    this.config.swap.ethAmount,
                    `0x${this.swapParams.hashlock}`,
                    this.swapParams.timelock
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
    
    async executeCrossChainSwap() {
        console.log('🔓 STEP 5: EXECUTE CROSS-CHAIN SWAP (User)');
        console.log('==========================================');
        
        try {
            // Reveal secret and execute swap
            console.log('📤 Executing cross-chain swap with secret reveal...');
            const tx = await this.resolver.executeCrossChainSwap(this.orderHash, `0x${this.swapParams.secret.toString('hex')}`);
            
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
    
    async claimAlgorandHTLC() {
        console.log('🪙 STEP 6: CLAIM ALGORAND HTLC (Relayer)');
        console.log('=========================================');
        
        try {
            // Get suggested params
            const suggestedParams = await this.algoClient.getTransactionParams().do();
            
            // Create app call to claim HTLC
            const claimTxn = algosdk.makeApplicationCallTxnFromObject({
                from: this.relayerAlgoAccount.addr,
                appIndex: this.config.algorand.appId,
                onComplete: algosdk.OnApplicationComplete.NoOpOC,
                appArgs: [
                    new Uint8Array(Buffer.from('claim_htlc', 'utf8')),
                    new Uint8Array(Buffer.from(this.swapParams.secret.toString('hex'), 'hex'))
                ],
                suggestedParams: suggestedParams
            });
            
            // Sign and submit
            const signedClaim = claimTxn.signTxn(this.relayerAlgoAccount.sk);
            
            console.log('📤 Submitting claim transaction...');
            const { txId } = await this.algoClient.sendRawTransaction(signedClaim).do();
            console.log(`   ⏳ Transaction ID: ${txId}`);
            
            // Wait for confirmation
            console.log('   ⏳ Waiting for confirmation...');
            const confirmedTxn = await algosdk.waitForConfirmation(this.algoClient, txId, 4);
            
            console.log('✅ Algorand HTLC claimed successfully!');
            console.log(`   🔗 Confirmed in round: ${confirmedTxn['confirmed-round']}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${txId}`);
            console.log('');
            
            return txId;
            
        } catch (error) {
            console.error('❌ Algorand HTLC claim failed:', error.message);
            throw error;
        }
    }
    
    async checkFinalBalances() {
        console.log('💰 STEP 7: CHECK FINAL BALANCES');
        console.log('===============================');
        
        try {
            // Check final balances
            const finalUserETHBalance = await this.ethProvider.getBalance(this.ethWallet.address);
            const finalRelayerETHBalance = await this.ethProvider.getBalance(this.config.ethereum.relayerAddress);
            
            const finalUserAlgoInfo = await this.algoClient.accountInformation(this.userAlgoAccount.addr).do();
            const finalRelayerAlgoInfo = await this.algoClient.accountInformation(this.relayerAlgoAccount.addr).do();
            
            console.log('👤 USER FINAL BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(finalUserETHBalance)} ETH`);
            console.log(`   ALGO: ${finalUserAlgoInfo.amount / 1000000} ALGO`);
            console.log('');
            console.log('🤖 RELAYER FINAL BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(finalRelayerETHBalance)} ETH`);
            console.log(`   ALGO: ${finalRelayerAlgoInfo.amount / 1000000} ALGO`);
            console.log('');
            
            // Calculate changes
            const userETHChange = finalUserETHBalance - this.initialBalances.userETH;
            const userALGOChange = (finalUserAlgoInfo.amount / 1000000) - this.initialBalances.userALGO;
            const relayerETHChange = finalRelayerETHBalance - this.initialBalances.relayerETH;
            const relayerALGOChange = (finalRelayerAlgoInfo.amount / 1000000) - this.initialBalances.relayerALGO;
            
            console.log('📊 BALANCE CHANGES:');
            console.log(`   🔗 User ETH: ${ethers.formatEther(userETHChange)} ETH`);
            console.log(`   👤 User ALGO: ${userALGOChange.toFixed(6)} ALGO`);
            console.log(`   🤖 Relayer ETH: ${ethers.formatEther(relayerETHChange)} ETH`);
            console.log(`   🤖 Relayer ALGO: ${relayerALGOChange.toFixed(6)} ALGO`);
            console.log('');
            
            // Verify swap success
            const swapSuccessful = userETHChange > 0 && relayerALGOChange > 0;
            
            if (swapSuccessful) {
                console.log('✅ ATOMIC SWAP SUCCESSFUL!');
                console.log('   - User received ETH');
                console.log('   - Relayer received ALGO');
                console.log('   - Cross-chain swap completed');
            } else {
                console.log('❌ ATOMIC SWAP FAILED!');
                console.log('   - Balance changes not as expected');
            }
            
            console.log('');
            return swapSuccessful;
            
        } catch (error) {
            console.error('❌ Final balance check failed:', error.message);
            throw error;
        }
    }
    
    async runCompleteTest() {
        try {
            console.log('🚀 STARTING COMPLETE ALGO → ETH ATOMIC SWAP TEST');
            console.log('================================================');
            console.log('');
            
            // Step 1: Check initial balances
            await this.checkInitialBalances();
            
            // Step 2: Create Algorand HTLC
            await this.createAlgorandHTLC();
            
            // Step 3: Create Ethereum order
            await this.createEthereumOrder();
            
            // Step 4: Create escrow contracts
            await this.createEscrowContracts();
            
            // Step 5: Execute cross-chain swap
            await this.executeCrossChainSwap();
            
            // Step 6: Claim Algorand HTLC
            await this.claimAlgorandHTLC();
            
            // Step 7: Check final balances
            const success = await this.checkFinalBalances();
            
            // Save test results
            const testResults = {
                testType: 'ALGO_TO_ETH_ATOMIC_SWAP',
                timestamp: new Date().toISOString(),
                success: success,
                swapParams: {
                    algoAmount: this.config.swap.algoAmount / 1000000,
                    ethAmount: ethers.formatEther(this.config.swap.ethAmount),
                    hashlock: this.swapParams.hashlock,
                    timelock: this.swapParams.timelock
                },
                transactions: {
                    algoHTLC: this.algoHTLCTxId,
                    ethOrder: this.orderHash
                },
                initialBalances: this.initialBalances,
                finalBalances: {
                    userETH: await this.ethProvider.getBalance(this.ethWallet.address),
                    userALGO: (await this.algoClient.accountInformation(this.userAlgoAccount.addr).do()).amount / 1000000,
                    relayerETH: await this.ethProvider.getBalance(this.config.ethereum.relayerAddress),
                    relayerALGO: (await this.algoClient.accountInformation(this.relayerAlgoAccount.addr).do()).amount / 1000000
                }
            };
            
            fs.writeFileSync('ALGO_TO_ETH_ATOMIC_SWAP_RESULTS.json', JSON.stringify(testResults, null, 2));
            console.log('📄 Test results saved to: ALGO_TO_ETH_ATOMIC_SWAP_RESULTS.json');
            
            if (success) {
                console.log('\n🎉 ALGO → ETH ATOMIC SWAP TEST COMPLETED SUCCESSFULLY!');
                console.log('✅ All steps completed');
                console.log('✅ Balances verified');
                console.log('✅ Cross-chain swap successful');
            } else {
                console.log('\n❌ ALGO → ETH ATOMIC SWAP TEST FAILED!');
                console.log('❌ Balance verification failed');
            }
            
        } catch (error) {
            console.error('\n❌ TEST FAILED:', error.message);
            throw error;
        }
    }
}

// Run the test
if (require.main === module) {
    const test = new ALGOtoETHAtomicSwapTest();
    test.runCompleteTest()
        .then(() => {
            console.log('\n✅ Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = ALGOtoETHAtomicSwapTest; 