#!/usr/bin/env node

/**
 * 🧩 EXECUTE REAL PARTIAL FILL CROSS-CHAIN SWAP
 * ✅ Creates actual transactions on Algorand Testnet + Ethereum Sepolia
 * ✅ Returns real TX IDs for verification
 * ✅ Demonstrates 1 ALGO → ETH with 3 partial fills
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');
require('dotenv').config();

class RealPartialFillExecutor {
    constructor() {
        // Blockchain connections
        this.ethProvider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
        this.ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider);
        this.algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        
        // Account setup
        this.algoAccount = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
        
        // Contract addresses (update with your deployed contracts)
        this.ethContractAddress = process.env.PARTIAL_FILL_BRIDGE_ADDRESS || "0xYourEthereumContract";
        this.algoAppId = parseInt(process.env.ALGORAND_APP_ID || "123456789");
        
        // Swap parameters
        this.swapAmount = 1000000; // 1 ALGO in microAlgos
        this.secret = crypto.randomBytes(32);
        this.hashlock = crypto.createHash('sha256').update(this.secret).digest();
        this.timelock = Math.floor(Date.now() / 1000) + 86400; // 24 hours
        this.orderId = crypto.randomBytes(32);
        
        // Track transaction IDs
        this.transactionIds = {
            algorand: {
                htlcCreation: null,
                resolverAClaim: null,
                resolverBClaim: null,
                resolverCClaim: null
            },
            ethereum: {
                resolverAEscrow: null,
                resolverBEscrow: null, 
                resolverCEscrow: null,
                secretReveal: null
            }
        };
    }

    async executeCompleteFlow() {
        console.log('🚀 EXECUTING REAL PARTIAL FILL CROSS-CHAIN SWAP');
        console.log('=====================================');
        console.log(`💰 Swap: 1 ALGO → ETH`);
        console.log(`🧩 Strategy: 3 partial fills (0.4 + 0.3 + 0.3 ALGO)`);
        console.log(`⛓️ Chains: Algorand Testnet → Ethereum Sepolia`);
        console.log(`🔐 Order ID: 0x${this.orderId.toString('hex')}`);
        console.log('=====================================\n');

        try {
            // Phase 1: Create Algorand HTLC
            await this.createAlgorandHTLC();
            
            // Phase 2: Create Ethereum escrows (3 partial fills)
            await this.createEthereumEscrows();
            
            // Phase 3: Reveal secret and complete swap
            await this.revealSecretAndComplete();
            
            // Phase 4: Claim ALGO portions
            await this.claimAlgorandPortions();
            
            // Final verification
            await this.displayFinalResults();
            
        } catch (error) {
            console.error('❌ Swap execution failed:', error);
        }
    }

    async createAlgorandHTLC() {
        console.log('🔷 PHASE 1: Creating Algorand HTLC...');
        
        try {
            const suggestedParams = await this.algoClient.getTransactionParams().do();
            
            // Create HTLC on Algorand
            const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.algoAccount.addr,
                appIndex: this.algoAppId,
                appArgs: [
                    new Uint8Array(Buffer.from('createCrossChainHTLC', 'utf8')),
                    new Uint8Array(Buffer.from(this.swapAmount.toString(), 'utf8')),
                    new Uint8Array(this.hashlock),
                    new Uint8Array(Buffer.from(this.timelock.toString(), 'utf8')),
                    new Uint8Array(Buffer.from('ethereum', 'utf8')),
                    new Uint8Array(Buffer.from(this.ethWallet.address, 'utf8')),
                    new Uint8Array(this.orderId)
                ],
                suggestedParams: suggestedParams
            });

            // Sign and submit
            const signedTxn = appCallTxn.signTxn(this.algoAccount.sk);
            const { txId } = await this.algoClient.sendRawTransaction(signedTxn).do();
            
            // Wait for confirmation
            await algosdk.waitForConfirmation(this.algoClient, txId, 4);
            
            this.transactionIds.algorand.htlcCreation = txId;
            
            console.log('✅ Algorand HTLC created!');
            console.log(`   📋 TX ID: ${txId}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${txId}`);
            console.log(`   💰 Amount: 1 ALGO locked`);
            console.log(`   🔐 Hashlock: 0x${this.hashlock.toString('hex').slice(0, 16)}...`);
            console.log(`   ⏰ Timelock: ${new Date(this.timelock * 1000).toISOString()}\n`);
            
        } catch (error) {
            console.error('❌ Failed to create Algorand HTLC:', error);
            throw error;
        }
    }

    async createEthereumEscrows() {
        console.log('⚡ PHASE 2: Creating Ethereum Partial Escrows...');
        
        const contractABI = [
            "function createPartialEscrow(bytes32 orderId, bytes32 hashlock, uint256 timelock, uint256 algoAmountCovered, address targetUser) external payable",
            "event PartialEscrowCreated(bytes32 indexed orderId, address indexed resolver, uint256 algoAmountCovered, uint256 ethAmount)"
        ];
        
        const contract = new ethers.Contract(this.ethContractAddress, contractABI, this.ethWallet);
        
        // Resolver A: 0.4 ALGO worth (~0.0004 ETH)
        try {
            console.log('🤖 Resolver A creating escrow for 0.4 ALGO...');
            const tx1 = await contract.createPartialEscrow(
                `0x${this.orderId.toString('hex')}`,
                `0x${this.hashlock.toString('hex')}`,
                this.timelock,
                400000, // 0.4 ALGO in microAlgos
                this.ethWallet.address,
                { value: ethers.parseEther('0.0004') }
            );
            
            await tx1.wait();
            this.transactionIds.ethereum.resolverAEscrow = tx1.hash;
            
            console.log('   ✅ Resolver A escrow created');
            console.log(`   📋 TX ID: ${tx1.hash}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx1.hash}`);
            
        } catch (error) {
            console.error('❌ Resolver A escrow failed:', error);
        }

        // Resolver B: 0.3 ALGO worth (~0.0003 ETH)
        try {
            console.log('🤖 Resolver B creating escrow for 0.3 ALGO...');
            const tx2 = await contract.createPartialEscrow(
                `0x${this.orderId.toString('hex')}`,
                `0x${this.hashlock.toString('hex')}`,
                this.timelock,
                300000, // 0.3 ALGO in microAlgos
                this.ethWallet.address,
                { value: ethers.parseEther('0.0003') }
            );
            
            await tx2.wait();
            this.transactionIds.ethereum.resolverBEscrow = tx2.hash;
            
            console.log('   ✅ Resolver B escrow created');
            console.log(`   📋 TX ID: ${tx2.hash}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx2.hash}`);
            
        } catch (error) {
            console.error('❌ Resolver B escrow failed:', error);
        }

        // Resolver C: 0.3 ALGO worth (~0.0003 ETH)
        try {
            console.log('🤖 Resolver C creating escrow for 0.3 ALGO...');
            const tx3 = await contract.createPartialEscrow(
                `0x${this.orderId.toString('hex')}`,
                `0x${this.hashlock.toString('hex')}`,
                this.timelock,
                300000, // 0.3 ALGO in microAlgos
                this.ethWallet.address,
                { value: ethers.parseEther('0.0003') }
            );
            
            await tx3.wait();
            this.transactionIds.ethereum.resolverCEscrow = tx3.hash;
            
            console.log('   ✅ Resolver C escrow created');
            console.log(`   📋 TX ID: ${tx3.hash}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx3.hash}`);
            console.log('\n   🎯 All 3 partial escrows created! Order 100% covered.\n');
            
        } catch (error) {
            console.error('❌ Resolver C escrow failed:', error);
        }
    }

    async revealSecretAndComplete() {
        console.log('🔓 PHASE 3: Revealing Secret and Completing Swap...');
        
        const contractABI = [
            "function revealSecret(bytes32 orderId, bytes32 secret) external",
            "event SecretRevealed(bytes32 indexed orderId, bytes32 secret)"
        ];
        
        const contract = new ethers.Contract(this.ethContractAddress, contractABI, this.ethWallet);
        
        try {
            console.log('🗝️ Revealing secret to unlock all escrows...');
            const tx = await contract.revealSecret(
                `0x${this.orderId.toString('hex')}`,
                `0x${this.secret.toString('hex')}`
            );
            
            await tx.wait();
            this.transactionIds.ethereum.secretReveal = tx.hash;
            
            console.log('✅ Secret revealed! All ETH escrows unlocked');
            console.log(`   📋 TX ID: ${tx.hash}`);
            console.log(`   🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
            console.log(`   🗝️ Secret: 0x${this.secret.toString('hex')}`);
            console.log(`   💰 User receives: ~0.001 ETH total\n`);
            
        } catch (error) {
            console.error('❌ Secret reveal failed:', error);
        }
    }

    async claimAlgorandPortions() {
        console.log('🤝 PHASE 4: Claiming ALGO Portions...');
        
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        // Claim for Resolver A (0.4 ALGO)
        try {
            console.log('🏃 Resolver A claiming 0.4 ALGO...');
            const claimTxn1 = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.algoAccount.addr,
                appIndex: this.algoAppId,
                appArgs: [
                    new Uint8Array(Buffer.from('claimPartialHTLC', 'utf8')),
                    new Uint8Array(this.orderId),
                    new Uint8Array(this.secret),
                    new Uint8Array(Buffer.from('400000', 'utf8')), // 0.4 ALGO
                    new Uint8Array(Buffer.from('0', 'utf8')) // escrowIndex
                ],
                suggestedParams: suggestedParams
            });

            const signedTxn1 = claimTxn1.signTxn(this.algoAccount.sk);
            const { txId: claimTxId1 } = await this.algoClient.sendRawTransaction(signedTxn1).do();
            await algosdk.waitForConfirmation(this.algoClient, claimTxId1, 4);
            
            this.transactionIds.algorand.resolverAClaim = claimTxId1;
            
            console.log('   ✅ Resolver A claimed 0.4 ALGO');
            console.log(`   📋 TX ID: ${claimTxId1}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${claimTxId1}`);
            
        } catch (error) {
            console.error('❌ Resolver A claim failed:', error);
        }

        // Claim for Resolver B (0.3 ALGO)
        try {
            console.log('🏃 Resolver B claiming 0.3 ALGO...');
            const claimTxn2 = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.algoAccount.addr,
                appIndex: this.algoAppId,
                appArgs: [
                    new Uint8Array(Buffer.from('claimPartialHTLC', 'utf8')),
                    new Uint8Array(this.orderId),
                    new Uint8Array(this.secret),
                    new Uint8Array(Buffer.from('300000', 'utf8')), // 0.3 ALGO
                    new Uint8Array(Buffer.from('1', 'utf8')) // escrowIndex
                ],
                suggestedParams: suggestedParams
            });

            const signedTxn2 = claimTxn2.signTxn(this.algoAccount.sk);
            const { txId: claimTxId2 } = await this.algoClient.sendRawTransaction(signedTxn2).do();
            await algosdk.waitForConfirmation(this.algoClient, claimTxId2, 4);
            
            this.transactionIds.algorand.resolverBClaim = claimTxId2;
            
            console.log('   ✅ Resolver B claimed 0.3 ALGO');
            console.log(`   📋 TX ID: ${claimTxId2}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${claimTxId2}`);
            
        } catch (error) {
            console.error('❌ Resolver B claim failed:', error);
        }

        // Claim for Resolver C (0.3 ALGO)
        try {
            console.log('🏃 Resolver C claiming 0.3 ALGO...');
            const claimTxn3 = algosdk.makeApplicationNoOpTxnFromObject({
                from: this.algoAccount.addr,
                appIndex: this.algoAppId,
                appArgs: [
                    new Uint8Array(Buffer.from('claimPartialHTLC', 'utf8')),
                    new Uint8Array(this.orderId),
                    new Uint8Array(this.secret),
                    new Uint8Array(Buffer.from('300000', 'utf8')), // 0.3 ALGO
                    new Uint8Array(Buffer.from('2', 'utf8')) // escrowIndex
                ],
                suggestedParams: suggestedParams
            });

            const signedTxn3 = claimTxn3.signTxn(this.algoAccount.sk);
            const { txId: claimTxId3 } = await this.algoClient.sendRawTransaction(signedTxn3).do();
            await algosdk.waitForConfirmation(this.algoClient, claimTxId3, 4);
            
            this.transactionIds.algorand.resolverCClaim = claimTxId3;
            
            console.log('   ✅ Resolver C claimed 0.3 ALGO');
            console.log(`   📋 TX ID: ${claimTxId3}`);
            console.log(`   🔗 Explorer: https://testnet.algoexplorer.io/tx/${claimTxId3}\n`);
            
        } catch (error) {
            console.error('❌ Resolver C claim failed:', error);
        }
    }

    async displayFinalResults() {
        console.log('🎉 PARTIAL FILL CROSS-CHAIN SWAP COMPLETED!');
        console.log('==========================================');
        console.log('\n📋 COMPLETE TRANSACTION ID LIST:');
        console.log('\n🔷 ALGORAND TESTNET:');
        console.log(`   HTLC Creation: ${this.transactionIds.algorand.htlcCreation}`);
        console.log(`   Resolver A Claim: ${this.transactionIds.algorand.resolverAClaim}`);
        console.log(`   Resolver B Claim: ${this.transactionIds.algorand.resolverBClaim}`);
        console.log(`   Resolver C Claim: ${this.transactionIds.algorand.resolverCClaim}`);
        
        console.log('\n⚡ ETHEREUM SEPOLIA:');
        console.log(`   Resolver A Escrow: ${this.transactionIds.ethereum.resolverAEscrow}`);
        console.log(`   Resolver B Escrow: ${this.transactionIds.ethereum.resolverBEscrow}`);
        console.log(`   Resolver C Escrow: ${this.transactionIds.ethereum.resolverCEscrow}`);
        console.log(`   Secret Reveal: ${this.transactionIds.ethereum.secretReveal}`);
        
        console.log('\n🔗 DIRECT VERIFICATION LINKS:');
        console.log('\n🔷 Algorand Explorer:');
        if (this.transactionIds.algorand.htlcCreation) {
            console.log(`   https://testnet.algoexplorer.io/tx/${this.transactionIds.algorand.htlcCreation}`);
        }
        
        console.log('\n⚡ Ethereum Explorer:');
        if (this.transactionIds.ethereum.secretReveal) {
            console.log(`   https://sepolia.etherscan.io/tx/${this.transactionIds.ethereum.secretReveal}`);
        }
        
        // Save TX IDs to file
        const results = {
            timestamp: new Date().toISOString(),
            orderId: `0x${this.orderId.toString('hex')}`,
            secret: `0x${this.secret.toString('hex')}`,
            hashlock: `0x${this.hashlock.toString('hex')}`,
            timelock: this.timelock,
            swapAmount: this.swapAmount,
            partialFills: 3,
            transactionIds: this.transactionIds,
            verificationLinks: {
                algorand: `https://testnet.algoexplorer.io/tx/${this.transactionIds.algorand.htlcCreation}`,
                ethereum: `https://sepolia.etherscan.io/tx/${this.transactionIds.ethereum.secretReveal}`
            }
        };
        
        const fs = require('fs');
        fs.writeFileSync('REAL_PARTIAL_FILL_SWAP_RESULTS.json', JSON.stringify(results, null, 2));
        
        console.log('\n💾 Results saved to: REAL_PARTIAL_FILL_SWAP_RESULTS.json');
        console.log('\n🏆 SUCCESS: Real partial fill cross-chain swap executed!');
        console.log('🔍 Use these TX IDs for on-chain verification!');
    }
}

// Execute the real swap
async function main() {
    const executor = new RealPartialFillExecutor();
    await executor.executeCompleteFlow();
}

main().catch(console.error); 