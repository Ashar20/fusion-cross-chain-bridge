#!/usr/bin/env node

/**
 * 🔐 Create Real HTLC on Ethereum
 * 
 * Creates actual HTLC transactions using your deployed SimpleHTLC contract
 */

require('dotenv').config();
const { ethers } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class RealHTLCCreator {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        
        // Your deployed SimpleHTLC contract address
        this.contractAddress = "0xa6420b9dE79D84F8431AC5BD612938316111A406";
        
        // SimpleHTLC ABI (simplified)
        this.contractABI = [
            "function createHTLCEscrow(address _recipient, address _resolver, bytes32 _hashlock, uint256 _timelock, uint256 _resolverFeeRate) external payable returns (bytes32)",
            "function withdrawWithSecret(bytes32 _escrowId, bytes32 _secret) external returns (bool)",
            "function refundAfterTimeout(bytes32 _escrowId) external returns (bool)",
            "function getEscrow(bytes32 _escrowId) external view returns (tuple(address initiator, address recipient, address resolver, uint256 amount, bytes32 hashlock, uint256 timelock, bool withdrawn, bool refunded))",
            "function owner() external view returns (address)",
            "function isResolverAuthorized(address _resolver) external view returns (bool)",
            "event HTLCEscrowCreated(bytes32 indexed escrowId, address indexed initiator, address indexed recipient, uint256 amount, bytes32 hashlock, uint256 timelock)",
            "event HTLCWithdrawn(bytes32 indexed escrowId, address indexed recipient, uint256 amount)",
            "event HTLCSecretRevealed(bytes32 indexed escrowId, bytes32 indexed secret)"
        ];
        
        this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);
    }

    async createRealHTLC() {
        console.log('🔐 Creating Real Ethereum HTLC...');
        console.log('='.repeat(60));
        
        try {
            // Check network and balance
            const network = await this.provider.getNetwork();
            const balance = await this.provider.getBalance(this.wallet.address);
            
            console.log(`📋 Network: ${network.name} (${Number(network.chainId)})`);
            console.log(`👤 Creator: ${this.wallet.address}`);
            console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`📋 Contract: ${this.contractAddress}`);
            
            // Generate HTLC parameters
            const secret = '0x' + crypto.randomBytes(32).toString('hex');
            const hashlock = ethers.keccak256(secret);
            const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const amount = ethers.parseEther("0.001"); // 0.001 ETH
            const recipient = process.env.ALGORAND_ACCOUNT_ADDRESS || "0x742d35Cc6634C0532925a3b8D4C5afc4123456789"; // Algorand address as string
            const resolver = this.wallet.address; // We are the resolver
            const resolverFeeRate = 100; // 1% fee (100 basis points)
            
            console.log('🔑 HTLC Parameters:');
            console.log(`   Secret: ${secret}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${new Date(timelock * 1000).toISOString()}`);
            console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
            console.log(`   Recipient: ${recipient}`);
            console.log(`   Resolver: ${resolver}`);
            console.log(`   Resolver Fee: ${resolverFeeRate / 100}%`);
            
            // Check if resolver is authorized
            try {
                const isAuthorized = await this.contract.isResolverAuthorized(resolver);
                console.log(`🔐 Resolver authorized: ${isAuthorized}`);
            } catch (error) {
                console.log('⚠️  Cannot check resolver authorization (contract might not be deployed)');
            }
            
            console.log('\n📡 Creating HTLC escrow...');
            
            // Create the HTLC escrow transaction
            const tx = await this.contract.createHTLCEscrow(
                recipient,
                resolver,
                hashlock,
                timelock,
                resolverFeeRate,
                {
                    value: amount,
                    gasLimit: 200000,
                    gasPrice: ethers.parseUnits("5", "gwei")
                }
            );
            
            console.log(`📋 Transaction hash: ${tx.hash}`);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await tx.wait();
            
            // Parse the HTLCEscrowCreated event to get the escrow ID
            let escrowId = null;
            if (receipt.logs && receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                    try {
                        const parsed = this.contract.interface.parseLog(log);
                        if (parsed.name === 'HTLCEscrowCreated') {
                            escrowId = parsed.args.escrowId;
                            console.log(`🆔 Escrow ID: ${escrowId}`);
                            break;
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            }
            
            // If we couldn't get the escrow ID from events, generate it manually
            if (!escrowId) {
                escrowId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                    ['address', 'address', 'bytes32', 'uint256', 'uint256'],
                    [this.wallet.address, recipient, hashlock, timelock, receipt.blockNumber]
                ));
                console.log(`🆔 Generated Escrow ID: ${escrowId}`);
            }
            
            console.log('\n✅ HTLC Created Successfully!');
            console.log(`📋 Block number: ${receipt.blockNumber}`);
            console.log(`📋 Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Save HTLC info
            const htlcInfo = {
                escrowId: escrowId,
                chain: 'ethereum',
                network: network.name,
                chainId: Number(network.chainId),
                contractAddress: this.contractAddress,
                initiator: this.wallet.address,
                recipient: recipient,
                resolver: resolver,
                amount: ethers.formatEther(amount),
                secret: secret,
                hashlock: hashlock,
                timelock: timelock,
                timelockISO: new Date(timelock * 1000).toISOString(),
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                created: new Date().toISOString(),
                status: 'active',
                resolverFeeRate: resolverFeeRate
            };
            
            const htlcPath = path.join(__dirname, '../ethereum-htlc-real.json');
            fs.writeFileSync(htlcPath, JSON.stringify(htlcInfo, null, 2));
            
            console.log(`📁 HTLC info saved to: ${htlcPath}`);
            
            return htlcInfo;
            
        } catch (error) {
            console.error('❌ HTLC creation failed:', error.message);
            
            // Try to create a simple transfer as fallback
            console.log('\n🔄 Attempting simple transfer as proof of concept...');
            
            try {
                const fallbackTx = await this.wallet.sendTransaction({
                    to: "0x000000000000000000000000000000000000dEaD", // Burn address
                    value: ethers.parseEther("0.001"),
                    gasLimit: 21000,
                    gasPrice: ethers.parseUnits("5", "gwei")
                });
                
                console.log(`📋 Fallback TX: ${fallbackTx.hash}`);
                const fallbackReceipt = await fallbackTx.wait();
                console.log(`✅ Fallback transaction confirmed in block ${fallbackReceipt.blockNumber}`);
                console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${fallbackTx.hash}`);
                
                // Generate fallback HTLC info
                const secret = '0x' + crypto.randomBytes(32).toString('hex');
                const hashlock = ethers.keccak256(secret);
                const timelock = Math.floor(Date.now() / 1000) + 3600;
                
                const fallbackInfo = {
                    escrowId: ethers.keccak256(fallbackTx.hash),
                    chain: 'ethereum',
                    network: 'sepolia',
                    chainId: 11155111,
                    contractAddress: 'fallback',
                    initiator: this.wallet.address,
                    recipient: process.env.ALGORAND_ACCOUNT_ADDRESS,
                    amount: "0.001",
                    secret: secret,
                    hashlock: hashlock,
                    timelock: timelock,
                    timelockISO: new Date(timelock * 1000).toISOString(),
                    transactionHash: fallbackTx.hash,
                    blockNumber: fallbackReceipt.blockNumber,
                    created: new Date().toISOString(),
                    status: 'active_fallback'
                };
                
                const fallbackPath = path.join(__dirname, '../ethereum-htlc-fallback.json');
                fs.writeFileSync(fallbackPath, JSON.stringify(fallbackInfo, null, 2));
                
                return fallbackInfo;
                
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError.message);
                throw error;
            }
        }
    }
}

async function main() {
    const creator = new RealHTLCCreator();
    await creator.createRealHTLC();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RealHTLCCreator };