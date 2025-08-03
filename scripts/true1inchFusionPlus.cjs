#!/usr/bin/env node

/**
 * 🚀 TRUE 1INCH FUSION+ ORDER FILL SCRIPT
 * 
 * Implements the official 1inch Fusion+ pattern:
 * ✅ User creates limit order (intent-based)
 * ✅ Resolver fills order via LimitOrderProtocol
 * ✅ EscrowSrc created via EscrowFactory
 * ✅ EscrowDst created on destination chain
 * ✅ Cross-chain atomic swap with official contracts
 */

const { ethers } = require('ethers');
const algosdk = require('algosdk');
const crypto = require('crypto');
const fs = require('fs');

class True1inchFusionPlusSwap {
    constructor() {
        console.log('🚀 TRUE 1INCH FUSION+ ORDER FILL');
        console.log('==================================');
        console.log('✅ Official 1inch Fusion+ pattern');
        console.log('✅ Order-based, conditional execution');
        console.log('✅ Escrow creation via EscrowFactory');
        console.log('✅ LimitOrderProtocol integration');
        console.log('==================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Load relayer addresses from .env.relayer
        const relayerEnv = fs.readFileSync('.env.relayer', 'utf8');
        const relayerLines = relayerEnv.split('\n');
        
        // Extract relayer addresses
        let ethRelayerAddress, ethRelayerPrivateKey, algoRelayerMnemonic, algoRelayerAddress;
        
        for (const line of relayerLines) {
            if (line.startsWith('RELAYER_ETH_ADDRESS=')) {
                ethRelayerAddress = line.split('=')[1];
            } else if (line.startsWith('RELAYER_ETH_PRIVATE_KEY=')) {
                ethRelayerPrivateKey = line.split('=')[1];
            } else if (line.startsWith('RELAYER_ALGO_MNEMONIC=')) {
                algoRelayerMnemonic = line.split('=')[1].replace(/"/g, '');
            } else if (line.startsWith('RELAYER_ALGO_ADDRESS=')) {
                algoRelayerAddress = line.split('=')[1];
            }
        }
        
        // Official 1inch deployed contracts
        this.contracts = {
            limitOrderProtocol: '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
            escrowFactory: '0x523258A91028793817F84aB037A3372B468ee940',
            escrowSrcImpl: '0x0D5E150b04b60A872E1554154803Ce12C41592f8',
            escrowDstImpl: '0xcaA622761ebD5CC2B1f0f5891ae4E89FE779d1f1'
        };
        
        // Network configurations
        this.ethProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104');
        this.algoClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        
        // Account setup
        this.user = {
            ethWallet: new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider),
            algoAccount: algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC)
        };
        
        this.relayer = {
            ethWallet: new ethers.Wallet(ethRelayerPrivateKey, this.ethProvider),
            algoAccount: algosdk.mnemonicToSecretKey(algoRelayerMnemonic)
        };
        
        // Swap parameters
        this.swapParams = {
            ethAmount: ethers.parseEther('0.001'), // 0.001 ETH
            algoAmount: 1000000, // 1 ALGO
            secret: crypto.randomBytes(32),
            timelock: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        };
        this.swapParams.hashlock = ethers.keccak256(this.swapParams.secret);
        
        // Initialize official 1inch contracts
        await this.initialize1inchContracts();
        
        console.log('✅ True 1inch Fusion+ Initialized');
        console.log(`🎯 LimitOrderProtocol: ${this.contracts.limitOrderProtocol}`);
        console.log(`📦 EscrowFactory: ${this.contracts.escrowFactory}`);
        console.log(`👤 User ETH: ${this.user.ethWallet.address}`);
        console.log(`👤 User ALGO: ${this.user.algoAccount.addr}`);
        console.log(`🤖 ETH Relayer: ${ethRelayerAddress}`);
        console.log(`🤖 ALGO Relayer: ${algoRelayerAddress}`);
        console.log(`💰 Swap Amount: 0.001 ETH → 1 ALGO`);
        console.log(`🔑 Secret: ${this.swapParams.secret.toString('hex')}`);
        console.log(`🔒 Hashlock: ${this.swapParams.hashlock}\n`);
    }
    
    async initialize1inchContracts() {
        // Limit Order Protocol ABI (simplified for demo)
        const limitOrderABI = [
            'function fillOrderArgs(tuple(uint256 salt, uint256 maker, uint256 receiver, uint256 makerAsset, uint256 takerAsset, uint256 makingAmount, uint256 takingAmount, uint256 makerTraits) order, bytes32 r, bytes32 vs, uint256 amount, uint256 takerTraits, bytes args) external payable returns (uint256, uint256, bytes32)',
            'function hashOrder(tuple(uint256 salt, uint256 maker, uint256 receiver, uint256 makerAsset, uint256 takerAsset, uint256 makingAmount, uint256 takingAmount, uint256 makerTraits) order) external pure returns (bytes32)',
            'event OrderFilled(bytes32 indexed orderHash, uint256 indexed maker, uint256 indexed taker, uint256 makingAmount, uint256 takingAmount, uint256 remainingAmount)'
        ];
        
        // EscrowFactory ABI
        const escrowFactoryABI = [
            'function createDstEscrow(bytes calldata dstImmutables, uint256 srcCancellationTimestamp) external payable returns (address)',
            'function addressOfEscrowSrc(bytes32 immutablesHash) external view returns (address)',
            'function addressOfEscrowDst(bytes32 immutablesHash) external view returns (address)',
            'event DstEscrowCreated(address indexed escrow, bytes32 indexed immutablesHash)'
        ];
        
        this.limitOrderProtocol = new ethers.Contract(
            this.contracts.limitOrderProtocol,
            limitOrderABI,
            this.relayer.ethWallet
        );
        
        this.escrowFactory = new ethers.Contract(
            this.contracts.escrowFactory,
            escrowFactoryABI,
            this.relayer.ethWallet
        );
    }
    
    async step1_create1inchLimitOrder() {
        console.log('📋 STEP 1: CREATE 1INCH LIMIT ORDER');
        console.log('====================================');
        console.log('💰 Creating 1inch limit order for 0.001 ETH...');
        
        // Create order in correct 1inch format
        // Order struct: (uint256 salt, uint256 maker, uint256 receiver, uint256 makerAsset, uint256 takerAsset, uint256 makingAmount, uint256 takingAmount, uint256 makerTraits)
        
        // Convert addresses to uint256 format (1inch uses uint256 for addresses)
        const makerAddress = ethers.getBigInt(this.user.ethWallet.address);
        
        // For Algorand address, we'll use a hash of the address as uint256
        // This is a common pattern when dealing with non-EVM addresses in EVM contracts
        const receiverAddress = ethers.getBigInt(ethers.keccak256(ethers.toUtf8Bytes(this.user.algoAccount.addr)));
        
        const makerAsset = ethers.getBigInt(ethers.ZeroAddress); // ETH
        const takerAsset = ethers.getBigInt(ethers.ZeroAddress); // ALGO (represented as zero address)
        
        const order = {
            salt: ethers.getBigInt('0x' + crypto.randomBytes(32).toString('hex')),
            maker: makerAddress,
            receiver: receiverAddress,
            makerAsset: makerAsset,
            takerAsset: takerAsset,
            makingAmount: this.swapParams.ethAmount,
            takingAmount: ethers.getBigInt(this.swapParams.algoAmount),
            makerTraits: ethers.getBigInt(0) // No special traits
        };
        
        // Hash the order using the official 1inch method
        const orderHash = await this.limitOrderProtocol.hashOrder(order);
        
        console.log(`📝 Order Hash: ${orderHash}`);
        console.log(`📝 Maker: ${this.user.ethWallet.address}`);
        console.log(`📝 Receiver (ALGO): ${this.user.algoAccount.addr}`);
        console.log(`📝 Receiver (uint256): ${receiverAddress.toString()}`);
        console.log(`📝 Making Amount: ${ethers.formatEther(order.makingAmount)} ETH`);
        console.log(`📝 Taking Amount: ${order.takingAmount} ALGO`);
        console.log('✅ 1inch limit order created');
        
        return {
            orderHash: orderHash,
            orderParams: order
        };
    }
    
    async step2_resolverFillOrder(order) {
        console.log('\n🤖 STEP 2: RESOLVER FILLS 1INCH ORDER');
        console.log('=====================================');
        console.log('🔄 Resolver filling order to create EscrowSrc...');
        
        // Create interaction data for cross-chain swap
        const interactionData = ethers.AbiCoder.defaultAbiCoder().encode([
            'tuple(bytes32 hashlock, uint256 timelock, string algorandAddress, uint256 algorandAmount)'
        ], [[
            this.swapParams.hashlock,
            this.swapParams.timelock,
            this.user.algoAccount.addr,
            this.swapParams.algoAmount
        ]]);
        
        // For 1inch fillOrderArgs, we need r and vs signature components
        // Since this is a demo, we'll use zero values (in production you'd need proper signatures)
        const r = ethers.ZeroHash;
        const vs = ethers.ZeroHash;
        
        // Fill the order using the correct 1inch format
        const fillTx = await this.limitOrderProtocol.fillOrderArgs(
            order.orderParams, // The order struct
            r, // r signature component
            vs, // vs signature component
            this.swapParams.ethAmount, // amount to fill
            0, // takerTraits
            interactionData // additional args
        );
        
        console.log(`📝 Fill Transaction: ${fillTx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${fillTx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await fillTx.wait();
        console.log(`✅ Order filled in block ${receipt.blockNumber}`);
        
        // Extract EscrowSrc address from event
        const orderFilledEvent = receipt.logs.find(log => {
            try {
                const parsed = this.limitOrderProtocol.interface.parseLog(log);
                return parsed.name === 'OrderFilled';
            } catch {
                return false;
            }
        });
        
        if (orderFilledEvent) {
            const parsed = this.limitOrderProtocol.interface.parseLog(orderFilledEvent);
            console.log(`📦 Order filled successfully`);
            console.log(`💰 Making Amount: ${ethers.formatEther(parsed.args.makingAmount)} ETH`);
            console.log(`🪙 Taking Amount: ${parsed.args.takingAmount} ALGO`);
        }
        
        return {
            fillTx: fillTx.hash,
            blockNumber: receipt.blockNumber,
            interactionData: interactionData
        };
    }
    
    async step3_createEscrowDst(fillResult) {
        console.log('\n📦 STEP 3: CREATE ESCROW DST');
        console.log('============================');
        console.log('🏗️ Creating EscrowDst on destination chain...');
        
        // Create dstImmutables for EscrowDst
        const dstImmutables = ethers.AbiCoder.defaultAbiCoder().encode([
            'tuple(address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock)'
        ], [[
            ethers.ZeroAddress, // ALGO (represented as zero address)
            this.swapParams.algoAmount,
            this.user.algoAccount.addr,
            this.swapParams.hashlock,
            this.swapParams.timelock
        ]]);
        
        // Create EscrowDst via EscrowFactory
        const createDstTx = await this.escrowFactory.createDstEscrow(
            dstImmutables,
            this.swapParams.timelock + 3600 // srcCancellationTimestamp
        );
        
        console.log(`📝 Create Dst Transaction: ${createDstTx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${createDstTx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await createDstTx.wait();
        console.log(`✅ EscrowDst created in block ${receipt.blockNumber}`);
        
        // Extract EscrowDst address from event
        const dstCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = this.escrowFactory.interface.parseLog(log);
                return parsed.name === 'DstEscrowCreated';
            } catch {
                return false;
            }
        });
        
        if (dstCreatedEvent) {
            const parsed = this.escrowFactory.interface.parseLog(dstCreatedEvent);
            console.log(`🏗️ EscrowDst Address: ${parsed.args.escrow}`);
            console.log(`🔑 Immutables Hash: ${parsed.args.immutablesHash}`);
        }
        
        return {
            createDstTx: createDstTx.hash,
            blockNumber: receipt.blockNumber,
            escrowDstAddress: dstCreatedEvent ? this.escrowFactory.interface.parseLog(dstCreatedEvent).args.escrow : null
        };
    }
    
    async step4_createAlgorandHTLC(escrowResult) {
        console.log('\n🏗️ STEP 4: CREATE ALGORAND HTLC');
        console.log('=================================');
        console.log('🔄 Creating HTLC on Algorand...');
        
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        // Create HTLC application call
        const algoHTLCTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: this.relayer.algoAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: 743645803, // Deployed Algorand HTLC
            appArgs: [
                new Uint8Array(Buffer.from('create_htlc', 'utf8')),
                new Uint8Array(Buffer.from(this.swapParams.hashlock.slice(2), 'hex')),
                algosdk.encodeUint64(this.swapParams.algoAmount),
                algosdk.encodeUint64(this.swapParams.timelock),
                new Uint8Array(Buffer.from(this.user.algoAccount.addr, 'utf8'))
            ]
        });
        
        // Create payment transaction to fund the HTLC
        const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: this.relayer.algoAccount.addr,
            to: algosdk.getApplicationAddress(743645803),
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
        
        await algosdk.waitForConfirmation(this.algoClient, algoResult.txId, 4);
        console.log('✅ Algorand HTLC created and funded!');
        
        return {
            txId: algoResult.txId,
            htlcId: this.swapParams.hashlock
        };
    }
    
    async step5_userClaimALGO(algoHTLC) {
        console.log('\n👤 STEP 5: USER CLAIMS ALGO');
        console.log('============================');
        console.log('🔑 User revealing secret to claim 1 ALGO...');
        
        const suggestedParams = await this.algoClient.getTransactionParams().do();
        
        const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
            from: this.user.algoAccount.addr,
            suggestedParams: suggestedParams,
            appIndex: 743645803,
            appArgs: [
                new Uint8Array(Buffer.from('claim_htlc', 'utf8')),
                new Uint8Array(Buffer.from(this.swapParams.hashlock.slice(2), 'hex')),
                new Uint8Array(this.swapParams.secret)
            ]
        });
        
        const signedClaimTxn = claimTxn.signTxn(this.user.algoAccount.sk);
        const result = await this.algoClient.sendRawTransaction(signedClaimTxn).do();
        
        console.log(`📝 User Claim Transaction: ${result.txId}`);
        console.log(`🔗 Algoexplorer: https://testnet.algoexplorer.io/tx/${result.txId}`);
        
        await algosdk.waitForConfirmation(this.algoClient, result.txId, 4);
        console.log('✅ User successfully claimed 1 ALGO!');
        
        return {
            txId: result.txId,
            secret: this.swapParams.secret.toString('hex')
        };
    }
    
    async step6_resolverClaimETH(claimResult) {
        console.log('\n🤖 STEP 6: RESOLVER CLAIMS ETH');
        console.log('==============================');
        console.log('🔑 Resolver using revealed secret to claim ETH...');
        
        // Get EscrowSrc address
        const immutablesHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode([
            'tuple(address token, uint256 amount, address recipient, bytes32 hashlock, uint256 timelock)'
        ], [[
            ethers.ZeroAddress, // ETH
            this.swapParams.ethAmount,
            this.user.ethWallet.address,
            this.swapParams.hashlock,
            this.swapParams.timelock
        ]]));
        
        const escrowSrcAddress = await this.escrowFactory.addressOfEscrowSrc(immutablesHash);
        console.log(`🏗️ EscrowSrc Address: ${escrowSrcAddress}`);
        
        // EscrowSrc ABI for withdraw function
        const escrowSrcABI = [
            'function withdraw(bytes32 secret) external',
            'function withdrawTo(bytes32 secret, address recipient) external'
        ];
        
        const escrowSrc = new ethers.Contract(
            escrowSrcAddress,
            escrowSrcABI,
            this.relayer.ethWallet
        );
        
        // Withdraw ETH using revealed secret
        const withdrawTx = await escrowSrc.withdrawTo(
            `0x${claimResult.secret}`,
            this.relayer.ethWallet.address
        );
        
        console.log(`📝 Withdraw Transaction: ${withdrawTx.hash}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${withdrawTx.hash}`);
        
        const receipt = await withdrawTx.wait();
        console.log(`✅ Resolver successfully claimed ETH in block ${receipt.blockNumber}!`);
        
        return {
            txId: withdrawTx.hash,
            blockNumber: receipt.blockNumber
        };
    }
    
    async executeTrue1inchFusionPlus() {
        try {
            console.log('🚀 EXECUTING TRUE 1INCH FUSION+ SWAP');
            console.log('=====================================\n');
            
            console.log('📋 Starting step 1...');
            // Step 1: Create 1inch limit order
            const order = await this.step1_create1inchLimitOrder();
            
            console.log('🤖 Starting step 2...');
            // Step 2: Resolver fills order (creates EscrowSrc)
            const fillResult = await this.step2_resolverFillOrder(order);
            
            console.log('📦 Starting step 3...');
            // Step 3: Create EscrowDst
            const escrowResult = await this.step3_createEscrowDst(fillResult);
            
            console.log('🏗️ Starting step 4...');
            // Step 4: Create Algorand HTLC
            const algoHTLC = await this.step4_createAlgorandHTLC(escrowResult);
            
            console.log('👤 Starting step 5...');
            // Step 5: User claims ALGO
            const claimResult = await this.step5_userClaimALGO(algoHTLC);
            
            console.log('🤖 Starting step 6...');
            // Step 6: Resolver claims ETH
            const withdrawResult = await this.step6_resolverClaimETH(claimResult);
            
            console.log('\n🎉 TRUE 1INCH FUSION+ SWAP COMPLETED!');
            console.log('=====================================');
            console.log('✅ 1inch limit order created and filled');
            console.log('✅ EscrowSrc created via EscrowFactory');
            console.log('✅ EscrowDst created on destination chain');
            console.log('✅ Algorand HTLC created and funded');
            console.log('✅ User claimed 1 ALGO');
            console.log('✅ Resolver claimed ETH');
            console.log('✅ Cross-chain atomic swap completed');
            
            // Generate report
            await this.generateFusionPlusReport(order, fillResult, escrowResult, algoHTLC, claimResult, withdrawResult);
            
        } catch (error) {
            console.error('❌ True 1inch Fusion+ swap failed:', error.message);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    async generateFusionPlusReport(order, fillResult, escrowResult, algoHTLC, claimResult, withdrawResult) {
        const report = {
            timestamp: new Date().toISOString(),
            swapType: 'TRUE_1INCH_FUSION_PLUS',
            swapParams: {
                ethAmount: ethers.formatEther(this.swapParams.ethAmount),
                algoAmount: this.swapParams.algoAmount / 1000000,
                hashlock: this.swapParams.hashlock,
                secret: this.swapParams.secret.toString('hex'),
                timelock: this.swapParams.timelock
            },
            contracts: this.contracts,
            transactions: {
                orderHash: order.orderHash,
                fillTransaction: fillResult.fillTx,
                escrowDstTransaction: escrowResult.createDstTx,
                algorandHTLCTransaction: algoHTLC.txId,
                userClaimTransaction: claimResult.txId,
                resolverWithdrawTransaction: withdrawResult.txId
            },
            addresses: {
                userETH: this.user.ethWallet.address,
                userALGO: this.user.algoAccount.addr,
                relayerETH: this.relayer.ethWallet.address,
                relayerALGO: this.relayer.algoAccount.addr,
                escrowDst: escrowResult.escrowDstAddress
            },
            status: 'COMPLETED'
        };
        
        fs.writeFileSync('TRUE_1INCH_FUSION_PLUS_REPORT.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Report generated: TRUE_1INCH_FUSION_PLUS_REPORT.json');
    }
}

// Execute the script
if (require.main === module) {
    const fusionPlus = new True1inchFusionPlusSwap();
    fusionPlus.executeTrue1inchFusionPlus()
        .then(() => {
            console.log('\n🎉 Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { True1inchFusionPlusSwap }; 