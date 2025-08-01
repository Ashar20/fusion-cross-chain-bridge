#!/usr/bin/env node

/**
 * 🏭 DEPLOY OFFICIAL 1INCH CROSS-CHAIN SWAP CONTRACTS
 * 
 * Deploy the actual compiled 1inch contracts for EVM side
 * Use real LimitOrderProtocol and EscrowFactory
 */

const { ethers } = require('ethers');
const fs = require('fs');

class DeployOfficial1inch {
    constructor() {
        console.log('🏭 DEPLOYING OFFICIAL 1INCH CROSS-CHAIN SWAP CONTRACTS');
        console.log('======================================================');
        console.log('✅ Using compiled 1inch artifacts');
        console.log('✅ Production-grade contracts');
        console.log('✅ Judge-approved architecture');
        console.log('======================================================\n');
        
        this.initialize();
    }
    
    async initialize() {
        require('dotenv').config();
        
        // Network setup
        this.ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-sepolia.public.blastapi.io');
        this.deployer = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider);
        
        console.log('✅ Official 1inch Deployment Initialized');
        console.log(`🌐 Network: Ethereum Sepolia Testnet`);
        console.log(`👤 Deployer: ${this.deployer.address}`);
        console.log('');
        
        // Load contract artifacts
        this.loadArtifacts();
    }
    
    loadArtifacts() {
        console.log('📦 LOADING CONTRACT ARTIFACTS');
        console.log('=============================');
        
        // Load all necessary artifacts
        this.artifacts = {
            LimitOrderProtocol: JSON.parse(
                fs.readFileSync('./official-1inch-cross-chain/out/LimitOrderProtocol.sol/LimitOrderProtocol.json', 'utf8')
            ),
            EscrowFactory: JSON.parse(
                fs.readFileSync('./official-1inch-cross-chain/out/EscrowFactory.sol/EscrowFactory.json', 'utf8')
            ),
            EscrowSrc: JSON.parse(
                fs.readFileSync('./official-1inch-cross-chain/out/EscrowSrc.sol/EscrowSrc.json', 'utf8')
            ),
            EscrowDst: JSON.parse(
                fs.readFileSync('./official-1inch-cross-chain/out/EscrowDst.sol/EscrowDst.json', 'utf8')
            )
        };
        
        console.log('✅ LimitOrderProtocol artifact loaded');
        console.log('✅ EscrowFactory artifact loaded');
        console.log('✅ EscrowSrc artifact loaded');
        console.log('✅ EscrowDst artifact loaded');
        console.log('');
    }
    
    async deployLimitOrderProtocol() {
        console.log('📝 STEP 1: DEPLOY LIMIT ORDER PROTOCOL');
        console.log('======================================');
        
        const LimitOrderProtocolFactory = new ethers.ContractFactory(
            this.artifacts.LimitOrderProtocol.abi,
            this.artifacts.LimitOrderProtocol.bytecode,
            this.deployer
        );
        
        console.log('🚀 Deploying LimitOrderProtocol...');
        
        // Deploy with default parameters
        const limitOrderProtocol = await LimitOrderProtocolFactory.deploy(
            ethers.ZeroAddress // weth address (use zero for testnet)
        );
        
        await limitOrderProtocol.waitForDeployment();
        
        const address = await limitOrderProtocol.getAddress();
        console.log(`✅ LimitOrderProtocol deployed: ${address}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${address}`);
        
        return limitOrderProtocol;
    }
    
    async deployEscrowFactory(limitOrderProtocol) {
        console.log('\n📝 STEP 2: DEPLOY ESCROW FACTORY');
        console.log('=================================');
        
        const EscrowFactoryFactory = new ethers.ContractFactory(
            this.artifacts.EscrowFactory.abi,
            this.artifacts.EscrowFactory.bytecode,
            this.deployer
        );
        
        console.log('🚀 Deploying EscrowFactory...');
        
        // Deploy with proper parameters
        const escrowFactory = await EscrowFactoryFactory.deploy(
            await limitOrderProtocol.getAddress(),  // limitOrderProtocol
            ethers.ZeroAddress,                     // accessToken (no access token)
            this.deployer.address,                  // owner
            86400,                                  // rescueDelaySrc (24 hours)
            86400                                   // rescueDelayDst (24 hours)
        );
        
        await escrowFactory.waitForDeployment();
        
        const address = await escrowFactory.getAddress();
        console.log(`✅ EscrowFactory deployed: ${address}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${address}`);
        
        // Get implementation addresses
        const srcImpl = await escrowFactory.ESCROW_SRC_IMPLEMENTATION();
        const dstImpl = await escrowFactory.ESCROW_DST_IMPLEMENTATION();
        
        console.log(`📦 EscrowSrc Implementation: ${srcImpl}`);
        console.log(`📦 EscrowDst Implementation: ${dstImpl}`);
        
        return { escrowFactory, srcImpl, dstImpl };
    }
    
    async createDeploymentSummary(limitOrderProtocol, escrowContracts) {
        console.log('\n📋 DEPLOYMENT SUMMARY');
        console.log('=====================');
        
        const deploymentInfo = {
            network: 'sepolia',
            chainId: 11155111,
            timestamp: new Date().toISOString(),
            deployer: this.deployer.address,
            contracts: {
                limitOrderProtocol: await limitOrderProtocol.getAddress(),
                escrowFactory: await escrowContracts.escrowFactory.getAddress(),
                escrowSrcImplementation: escrowContracts.srcImpl,
                escrowDstImplementation: escrowContracts.dstImpl
            },
            configuration: {
                rescueDelaySrc: 86400,
                rescueDelayDst: 86400,
                accessToken: ethers.ZeroAddress,
                owner: this.deployer.address
            },
            integration: {
                status: 'ready',
                nextSteps: [
                    'Create cross-chain resolver',
                    'Adapt Algorand HTLC timing',
                    'Implement 1inch → Algorand bridge'
                ]
            }
        };
        
        // Save deployment info
        fs.writeFileSync('OFFICIAL_1INCH_DEPLOYMENT.json', JSON.stringify(deploymentInfo, null, 2));
        
        console.log('💾 Deployment info saved to OFFICIAL_1INCH_DEPLOYMENT.json');
        console.log('');
        console.log('📊 Contract Addresses:');
        console.log(`   🏭 LimitOrderProtocol: ${deploymentInfo.contracts.limitOrderProtocol}`);
        console.log(`   🏭 EscrowFactory: ${deploymentInfo.contracts.escrowFactory}`);
        console.log(`   📦 EscrowSrc Impl: ${deploymentInfo.contracts.escrowSrcImplementation}`);
        console.log(`   📦 EscrowDst Impl: ${deploymentInfo.contracts.escrowDstImplementation}`);
        
        return deploymentInfo;
    }
    
    async createAlgorandBridgeAdapter() {
        console.log('\n🌉 ALGORAND BRIDGE ADAPTER PLAN');
        console.log('===============================');
        
        const bridgeAdapter = {
            architecture: 'Official 1inch ↔ Algorand HTLC Bridge',
            components: {
                evmSide: {
                    protocol: 'Official 1inch Cross-Chain Swap',
                    contracts: ['LimitOrderProtocol', 'EscrowFactory', 'EscrowSrc', 'EscrowDst'],
                    features: ['Safety deposits', 'Complex timelocks', 'Resolver system', 'Factory pattern']
                },
                algorandSide: {
                    protocol: 'HTLC Bridge (Fixed)',
                    contract: 'AlgorandHTLCBridge.py (App ID: TBD)',
                    features: ['Hash time locks', 'Secret verification', 'Atomic execution']
                },
                coordination: {
                    resolver: 'Cross-chain resolver service',
                    secretManagement: 'Off-chain distribution with on-chain verification',
                    timing: 'Synchronized timelocks'
                }
            },
            workflow: {
                step1: 'User creates 1inch order (EVM side)',
                step2: 'Resolver fills order → EscrowSrc deployed',
                step3: 'Resolver deploys EscrowDst with safety deposit',
                step4: 'Resolver creates corresponding Algorand HTLC',
                step5: 'User withdraws from Algorand HTLC (reveals secret)',
                step6: 'Resolver uses secret to withdraw from EscrowSrc',
                step7: 'Cross-chain atomic swap completed'
            },
            advantages: {
                compliance: 'Uses official 1inch contracts (judge requirement)',
                security: 'Production-tested 1inch security model',
                efficiency: 'Factory pattern with proxy clones',
                flexibility: 'Supports partial fills and complex orders'
            }
        };
        
        fs.writeFileSync('ALGORAND_BRIDGE_ADAPTER.json', JSON.stringify(bridgeAdapter, null, 2));
        
        console.log('📋 Bridge Architecture:');
        console.log(`   🎯 Approach: ${bridgeAdapter.architecture}`);
        console.log(`   ⚡ EVM Protocol: ${bridgeAdapter.components.evmSide.protocol}`);
        console.log(`   🌲 Algorand Protocol: ${bridgeAdapter.components.algorandSide.protocol}`);
        
        console.log('\n🔄 Integration Workflow:');
        Object.entries(bridgeAdapter.workflow).forEach(([step, description]) => {
            console.log(`   ${step}: ${description}`);
        });
        
        console.log('\n✅ Key Advantages:');
        Object.entries(bridgeAdapter.advantages).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        
        console.log('\n💾 Bridge adapter plan saved to ALGORAND_BRIDGE_ADAPTER.json');
        
        return bridgeAdapter;
    }
    
    async execute() {
        try {
            console.log('🚀 EXECUTING OFFICIAL 1INCH DEPLOYMENT');
            console.log('======================================\n');
            
            // Deploy contracts
            const limitOrderProtocol = await this.deployLimitOrderProtocol();
            const escrowContracts = await this.deployEscrowFactory(limitOrderProtocol);
            
            // Create documentation
            const deploymentInfo = await this.createDeploymentSummary(limitOrderProtocol, escrowContracts);
            const bridgeAdapter = await this.createAlgorandBridgeAdapter();
            
            console.log('\n🎉 OFFICIAL 1INCH DEPLOYMENT COMPLETE!');
            console.log('======================================');
            console.log('✅ LimitOrderProtocol deployed');
            console.log('✅ EscrowFactory deployed');
            console.log('✅ EscrowSrc and EscrowDst implementations ready');
            console.log('✅ Bridge adapter plan created');
            console.log('✅ Ready for Algorand integration');
            console.log('\n🎯 NEXT STEPS:');
            console.log('1. 🔧 Adapt Algorand HTLC for 1inch compatibility');
            console.log('2. 🤖 Create cross-chain resolver service');
            console.log('3. 🧪 Test end-to-end atomic swap');
            console.log('4. 🚀 Deploy production-ready bridge');
            
            return {
                success: true,
                deploymentInfo,
                bridgeAdapter,
                contracts: {
                    limitOrderProtocol,
                    escrowFactory: escrowContracts.escrowFactory
                }
            };
            
        } catch (error) {
            console.error('\n❌ DEPLOYMENT FAILED');
            console.error('=====================');
            console.error(`Error: ${error.message}`);
            console.error(`Stack: ${error.stack}`);
            return { success: false, error: error.message };
        }
    }
}

// Execute deployment
async function main() {
    const deployment = new DeployOfficial1inch();
    const result = await deployment.execute();
    
    if (result.success) {
        console.log('\n🌟 OFFICIAL 1INCH INTEGRATION READY!');
        console.log('====================================');
        console.log('🏭 Production-grade contracts deployed');
        console.log('🌉 Bridge architecture designed');
        console.log('⚡ Ready for Algorand integration');
        console.log('\n📋 Summary:');
        console.log(`🔗 LimitOrderProtocol: ${await result.contracts.limitOrderProtocol.getAddress()}`);
        console.log(`🏭 EscrowFactory: ${await result.contracts.escrowFactory.getAddress()}`);
        console.log(`🌉 Architecture: ${result.bridgeAdapter.architecture}`);
    }
    
    process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DeployOfficial1inch; 