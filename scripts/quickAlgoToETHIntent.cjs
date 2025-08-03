#!/usr/bin/env node

/**
 * ⚡ QUICK ALGO → ETH INTENT CREATOR
 * 
 * Simple script to create a 1 ALGO → ETH swap intent
 * that the multi-resolver relayer can detect and process
 */

const { ethers } = require('ethers');

async function createQuickIntent() {
    console.log('⚡ QUICK ALGO → ETH INTENT CREATOR');
    console.log('=================================\n');
    
    try {
        // Load environment
        require('dotenv').config();
        
        const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.SEPOLIA_URL || 'https://ethereum-sepolia.publicnode.com';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log(`🌐 Using RPC: ${rpcUrl}`);
        console.log(`💰 Wallet: ${wallet.address}`);
        
        const lopBridgeABI = [
            'function submitLimitOrder(tuple(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string algorandAddress, bytes32 salt) intent, bytes signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32 orderId)',
            'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock)'
        ];
        
        const lopBridge = new ethers.Contract(
            '0x68b68381b76e705A7Ef8209800D0886e21b654FE',
            lopBridgeABI,
            wallet
        );
        
        console.log('🎯 Creating 1 ALGO → 0.001 ETH swap intent...');
        
        // Generate atomic swap parameters
        const secret = ethers.randomBytes(32);
        const hashlock = ethers.keccak256(secret);
        
        // Get Algorand address from environment or use default
        const algoMnemonic = process.env.ALGORAND_MNEMONIC || process.env.ALGO_MNEMONIC;
        let algorandAddress = 'BJDBVZITI7VRHJLMPY4C6BX5UVBHZVNT6PRD3ZZWO2E2HSDYGSF4KO6RR4'; // Default
        
        if (algoMnemonic) {
            try {
                const algosdk = require('algosdk');
                const algoAccount = algosdk.mnemonicToSecretKey(algoMnemonic.replace(/"/g, ''));
                algorandAddress = algoAccount.addr;
                console.log(`✅ Using Algorand address from environment: ${algorandAddress}`);
            } catch (error) {
                console.log(`⚠️  Could not parse Algorand mnemonic, using default address`);
            }
        } else {
            console.log(`⚠️  No Algorand mnemonic found, using default address: ${algorandAddress}`);
        }

        const intent = {
            maker: wallet.address,
            makerToken: ethers.ZeroAddress, // ETH (what we're depositing)
            takerToken: ethers.ZeroAddress, // ALGO (what we want to receive)
            makerAmount: ethers.parseEther('0.001'), // Depositing 0.001 ETH
            takerAmount: ethers.parseUnits('1000000', 0), // Want 1 ALGO (in microAlgos)
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            algorandChainId: 416002, // Algorand testnet
            algorandAddress: algorandAddress,
            salt: ethers.randomBytes(32)
        };
        
        const timelock = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
        
        console.log('📋 Intent Details:');
        console.log(`   Depositing: ${ethers.formatEther(intent.makerAmount)} ETH`);
        console.log(`   Requesting: 1 ALGO (${intent.takerAmount.toString()} microALGO)`);
        console.log(`   Deadline: ${new Date(intent.deadline * 1000).toISOString()}`);
        console.log(`   Timelock: ${new Date(timelock * 1000).toISOString()}`);
        console.log(`   Secret: ${ethers.hexlify(secret)}`);
        console.log(`   Hashlock: ${hashlock}`);
        
        // Create EIP-712 signature
        console.log('\\n🔏 Creating EIP-712 signature...');
        
        const domain = {
            name: 'LimitOrderBridge',
            version: '1',
            chainId: 11155111, // Sepolia
            verifyingContract: '0x68b68381b76e705A7Ef8209800D0886e21b654FE'
        };
        
        const types = {
            LimitOrderIntent: [
                { name: 'maker', type: 'address' },
                { name: 'makerToken', type: 'address' },
                { name: 'takerToken', type: 'address' },
                { name: 'makerAmount', type: 'uint256' },
                { name: 'takerAmount', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
                { name: 'algorandChainId', type: 'uint256' },
                { name: 'algorandAddress', type: 'string' },
                { name: 'salt', type: 'bytes32' }
            ]
        };
        
        console.log('📝 Signing intent with EIP-712...');
        const signature = await wallet.signTypedData(domain, types, intent);
        console.log(`✅ Signature: ${signature.slice(0, 20)}...`);
        
        // Create the limit order
        console.log('\\n🚀 Submitting limit order...');
        const tx = await lopBridge.submitLimitOrder(intent, signature, hashlock, timelock, {
            value: intent.makerAmount, // Send ETH deposit
            gasLimit: 500000,
            maxFeePerGas: ethers.parseUnits('20', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        });
        
        console.log(`🔗 Transaction: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Intent created in block ${receipt.blockNumber}`);
        
        // Extract order ID
        const orderEvent = receipt.logs.find(log => {
            try {
                const parsed = lopBridge.interface.parseLog(log);
                return parsed.name === 'LimitOrderCreated';
            } catch {
                return false;
            }
        });
        
        if (orderEvent) {
            const parsedEvent = lopBridge.interface.parseLog(orderEvent);
            const orderId = parsedEvent.args.orderId;
            
            console.log('\\n🎉 SUCCESS!');
            console.log('============');
            console.log(`🆔 Order ID: ${orderId}`);
            console.log(`🔑 Secret: ${ethers.hexlify(secret)}`);
            console.log(`🔒 Hashlock: ${hashlock}`);
            console.log('\\n🤖 The multi-resolver relayer should detect this order!');
            console.log('🏁 Run: node scripts/multiResolverRelayer.cjs');
            
            // Save details
            const intentData = {
                orderId,
                secret: ethers.hexlify(secret),
                hashlock,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                createdAt: new Date().toISOString()
            };
            
            require('fs').writeFileSync('quick-intent.json', JSON.stringify(intentData, null, 2));
            console.log('💾 Details saved to: quick-intent.json');
            
        } else {
            console.log('❌ Could not find LimitOrderCreated event');
        }
        
    } catch (error) {
        console.error('❌ Failed to create intent:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\\n💡 Solution: Add ETH to your account for gas fees');
        }
    }
}

createQuickIntent().catch(console.error);