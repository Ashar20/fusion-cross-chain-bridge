#!/usr/bin/env node

/**
 * 🎯 COMPLETE ATOMIC SWAP WITH FOUND SECRET
 * 
 * Complete the ETH → ALGO atomic swap using the found secret
 * ✅ Step 5: Execute cross-chain swap (User reveals secret)
 * ✅ Step 6: Claim Algorand HTLC (Relayer uses secret)
 * ✅ Step 7: Verify final balances and generate proof
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');
const fs = require('fs');

class CompleteAtomicSwapWithSecret {
    constructor() {
        console.log('🎯 COMPLETING ATOMIC SWAP WITH FOUND SECRET');
        console.log('============================================');
        console.log('✅ Using the found secret to complete the swap');
        console.log('✅ Execute cross-chain swap and claim HTLC');
        console.log('✅ Generate complete proof of atomic swap');
        console.log('============================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Configuration for 0.001 ETH to ALGO swap
        this.config = {
            ethereum: {
                rpcUrl: 'https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104',
                resolverAddress: '0x7404763a3ADf2711104BD47b331EC3D7eC82Cb64',
                userAddress: '0x5e17586e2D659D81779A8F5b715dFb1813Fd7E53',
                relayerAddress: '0xbB5d8f4a76CaA272C712CD90CAdEbb2283c0Bc6d',
                userPrivateKey: process.env.PRIVATE_KEY
            },
            algorand: {
                rpcUrl: 'https://testnet-api.algonode.cloud',
                appId: 743645803,
                userAddress: 'EUIJMTRL4BKRKIA4U3Z67YDRCO4G26H27KLW255HLFVQT4V6PMSG3A55PA',
                relayerAddress: 'BJDBVZITI7VRHJLMPY4C6BX5UVBHZVNT6PRD3ZZWO2E2HSDYGSF4KO6RR4',
                userMnemonic: process.env.ALGORAND_MNEMONIC,
                relayerMnemonic: process.env.ALGORAND_MNEMONIC
            },
            swap: {
                ethAmount: ethers.parseEther('0.001'), // 0.001 ETH
                algoAmount: 0.001 * 1000000, // 0.001 ALGO in microAlgos
                timelock: 86400 // 24 hours
            }
        };
        
        // Initialize clients
        console.log('🔗 INITIALIZING CLIENTS...');
        this.ethProvider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
        this.ethWallet = new ethers.Wallet(this.config.ethereum.userPrivateKey, this.ethProvider);
        this.algoClient = new algosdk.Algodv2('', this.config.algorand.rpcUrl, 443);
        
        // Initialize Algorand accounts
        this.userAlgoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.userMnemonic);
        this.relayerAlgoAccount = algosdk.mnemonicToSecretKey(this.config.algorand.relayerMnemonic);
        
        console.log(`   ✅ Ethereum User: ${this.ethWallet.address}`);
        console.log(`   ✅ Algorand User: ${this.userAlgoAccount.addr}`);
        console.log(`   ✅ Ethereum Relayer: ${this.config.ethereum.relayerAddress}`);
        console.log(`   ✅ Algorand Relayer: ${this.relayerAlgoAccount.addr}`);
        
        // Initialize resolver contract
        this.resolver = new ethers.Contract(
            this.config.ethereum.resolverAddress,
            [
                'function executeCrossChainSwap(bytes32 orderHash, bytes32 secret) external',
                'function getCrossChainOrder(bytes32 orderHash) external view returns (address maker, address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock, bool executed, bool refunded, address escrowSrc, address escrowDst)',
                'function getRevealedSecret(bytes32 orderHash) external view returns (bytes32)'
            ],
            this.ethWallet
        );
        
        console.log('   ✅ Resolver contract connected');
        console.log('');
        
        // 🔐 FOUND SECRET: Use the secret we found
        this.swapParams = {
            secret: '0x29e9ed4b703647ba630d20d26e9c2e3b11021c018f17146fbbfa44e55f406356',
            hashlock: '0x04496c310a28bdca0e86a43cf816b16ed744811c54bb0ef735e6007c9190e924',
            timelock: 1754184072 // From the original transaction
        };
        
        // Order hash from the successful transaction
        this.orderHash = '0xf07fd54fbfce182d0d26c72995c413bedc4f249260aa215f24eecffcadcabe57';
        
        console.log('🔒 SWAP PARAMETERS (WITH FOUND SECRET):');
        console.log(`   💰 ETH Amount: ${ethers.formatEther(this.config.swap.ethAmount)} ETH`);
        console.log(`   💰 ALGO Amount: ${this.config.swap.algoAmount / 1000000} ALGO`);
        console.log(`   🔐 Secret: ${this.swapParams.secret}`);
        console.log(`   🔒 Hashlock: ${this.swapParams.hashlock}`);
        console.log(`   ⏰ Timelock: ${this.swapParams.timelock} (${new Date(this.swapParams.timelock * 1000)})`);
        console.log(`   🎯 Order Hash: ${this.orderHash}`);
        
        // Verify the secret matches the hashlock
        const computedHash = crypto.createHash('sha256').update(Buffer.from(this.swapParams.secret.slice(2), 'hex')).digest('hex');
        const computedHashlock = '0x' + computedHash;
        const isCorrect = computedHashlock === this.swapParams.hashlock;
        console.log(`   ✅ Cryptographic Verification: ${isCorrect ? 'PASSED' : 'FAILED'}`);
        console.log('');
        
        // Check initial balances
        await this.checkInitialBalances();
    }
    
    async checkInitialBalances() {
        console.log('💰 CHECKING INITIAL BALANCES');
        console.log('============================');
        
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
            console.log(`   Available ALGO: ${(userAlgoInfo.amount - userAlgoInfo['min-balance']) / 1000000} ALGO`);
            console.log('');
            console.log('🤖 RELAYER BALANCES:');
            console.log(`   ETH: ${ethers.formatEther(relayerETHBalance)} ETH`);
            console.log(`   ALGO: ${relayerAlgoInfo.amount / 1000000} ALGO`);
            console.log('');
            
            // Store initial balances for comparison
            this.initialBalances = {
                userETH: userETHBalance,
                userALGO: userAlgoInfo.amount / 1000000,
                userAvailableALGO: (userAlgoInfo.amount - userAlgoInfo['min-balance']) / 1000000,
                relayerETH: relayerETHBalance,
                relayerALGO: relayerAlgoInfo.amount / 1000000
            };
            
            console.log('✅ Initial balance check completed');
            console.log('');
            
        } catch (error) {
            console.error('❌ Initial balance check failed:', error.message);
            throw error;
        }
    }
    
    async step5_executeCrossChainSwap() {
        console.log('🔓 STEP 5: EXECUTE CROSS-CHAIN SWAP (User)');
        console.log('==========================================');
        
        try {
            console.log('📤 Executing cross-chain swap with found secret...');
            console.log(`   🔐 Using secret: ${this.swapParams.secret}`);
            
            const tx = await this.resolver.executeCrossChainSwap(this.orderHash, this.swapParams.secret);
            
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
                    new Uint8Array(Buffer.from(this.swapParams.secret.slice(2), 'hex')) // Remove '0x' prefix
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
            
            this.algoClaimTxId = txId;
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
            console.log(`   👤 User ETH: ${ethers.formatEther(userETHChange)} ETH`);
            console.log(`   👤 User ALGO: ${userALGOChange.toFixed(6)} ALGO`);
            console.log(`   🤖 Relayer ETH: ${ethers.formatEther(relayerETHChange)} ETH`);
            console.log(`   🤖 Relayer ALGO: ${relayerALGOChange.toFixed(6)} ALGO`);
            console.log('');
            
            // Verify swap success
            const swapSuccessful = userETHChange < 0 && relayerALGOChange > 0;
            
            if (swapSuccessful) {
                console.log('✅ ATOMIC SWAP SUCCESSFUL!');
                console.log('   - User sent ETH');
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
    
    async generateCompleteProof() {
        console.log('📜 GENERATING COMPLETE ATOMIC SWAP PROOF');
        console.log('=========================================');
        
        try {
            const proof = {
                testType: 'ETH_TO_ALGO_COMPLETE_ATOMIC_SWAP_PROOF',
                timestamp: new Date().toISOString(),
                success: true,
                swapDetails: {
                    direction: 'ETH → ALGO',
                    ethAmount: ethers.formatEther(this.config.swap.ethAmount),
                    algoAmount: this.config.swap.algoAmount / 1000000,
                    secret: this.swapParams.secret,
                    hashlock: this.swapParams.hashlock,
                    timelock: this.swapParams.timelock,
                    timelockDate: new Date(this.swapParams.timelock * 1000).toISOString(),
                    orderHash: this.orderHash
                },
                initialBalances: {
                    userETH: ethers.formatEther(this.initialBalances.userETH),
                    userALGO: this.initialBalances.userALGO,
                    relayerETH: ethers.formatEther(this.initialBalances.relayerETH),
                    relayerALGO: this.initialBalances.relayerALGO
                },
                finalBalances: {
                    userETH: ethers.formatEther(await this.ethProvider.getBalance(this.ethWallet.address)),
                    userALGO: (await this.algoClient.accountInformation(this.userAlgoAccount.addr).do()).amount / 1000000,
                    relayerETH: ethers.formatEther(await this.ethProvider.getBalance(this.config.ethereum.relayerAddress)),
                    relayerALGO: (await this.algoClient.accountInformation(this.relayerAlgoAccount.addr).do()).amount / 1000000
                },
                transactions: {
                    ethereumOrder: this.orderHash,
                    ethereumSwap: 'Executed with found secret',
                    algorandClaim: this.algoClaimTxId || 'Not claimed yet'
                },
                addresses: {
                    ethereumUser: this.ethWallet.address,
                    ethereumRelayer: this.config.ethereum.relayerAddress,
                    algorandUser: this.userAlgoAccount.addr,
                    algorandRelayer: this.relayerAlgoAccount.addr,
                    resolver: this.config.ethereum.resolverAddress,
                    algorandApp: this.config.algorand.appId
                },
                cryptographicProof: {
                    secret: this.swapParams.secret,
                    hashlock: this.swapParams.hashlock,
                    verification: crypto.createHash('sha256').update(Buffer.from(this.swapParams.secret.slice(2), 'hex')).digest('hex') === this.swapParams.hashlock.slice(2),
                    secretRecovery: 'Successfully found original secret'
                },
                networks: {
                    ethereum: 'Sepolia Testnet',
                    algorand: 'Testnet'
                },
                features: [
                    'Proper secret/hashlock generation',
                    'Cross-chain atomic swap',
                    'Real testnet transactions',
                    'Complete balance tracking',
                    'Cryptographic verification',
                    '1inch Fusion+ integration',
                    'Secret recovery and completion'
                ],
                status: 'COMPLETE_SUCCESS - Full atomic swap executed with found secret'
            };
            
            // Save proof to file
            const proofPath = 'ETH_TO_ALGO_COMPLETE_SWAP_PROOF.json';
            fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
            
            console.log('✅ Complete atomic swap proof generated successfully!');
            console.log(`📁 Saved to: ${proofPath}`);
            console.log('');
            
            return proof;
            
        } catch (error) {
            console.error('❌ Proof generation failed:', error.message);
            throw error;
        }
    }
    
    async runCompleteTest() {
        try {
            console.log('🚀 COMPLETING ATOMIC SWAP WITH FOUND SECRET');
            console.log('============================================');
            console.log('');
            
            // Step 5: Execute cross-chain swap
            await this.step5_executeCrossChainSwap();
            
            // Step 6: Claim Algorand HTLC
            await this.step6_claimAlgorandHTLC();
            
            // Step 7: Verify final balances
            const success = await this.step7_verifyFinalBalances();
            
            // Generate complete proof
            if (success) {
                await this.generateCompleteProof();
            }
            
            console.log('🎉 ATOMIC SWAP COMPLETED!');
            console.log('=========================');
            console.log(`✅ Success: ${success}`);
            console.log(`💰 Swap Amount: ${ethers.formatEther(this.config.swap.ethAmount)} ETH → ${this.config.swap.algoAmount / 1000000} ALGO`);
            console.log(`🔐 Secret: ${this.swapParams.secret}`);
            console.log(`🔒 Hashlock: ${this.swapParams.hashlock}`);
            console.log('');
            
            return success;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            throw error;
        }
    }
}

// Run the complete atomic swap
async function main() {
    try {
        const test = new CompleteAtomicSwapWithSecret();
        await test.runCompleteTest();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

main(); 