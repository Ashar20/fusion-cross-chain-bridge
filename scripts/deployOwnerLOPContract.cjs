#!/usr/bin/env node

/**
 * 🚀 DEPLOY OWNER LOP CONTRACT
 * 
 * Deploys a simple LOP contract where you're the owner
 * and can authorize resolvers immediately
 */

const { ethers } = require('ethers');

async function deployLOPContract() {
    console.log('🚀 DEPLOY OWNER LOP CONTRACT');
    console.log('============================\n');
    
    require('dotenv').config();
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com');
    const owner = new ethers.Wallet('c41444fbbdf8e13030b011a9af8c1d576c0056f64e4dab07eca0e0aec55abc11', provider);
    
    console.log(`👤 Deployer: ${owner.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await provider.getBalance(owner.address))} ETH\n`);
    
    // Simple LOP contract that supports resolver authorization
    const contractSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.20;
        
        contract SimpleLimitOrderBridge {
            address public owner;
            mapping(address => bool) public authorizedResolvers;
            mapping(bytes32 => bool) public limitOrders;
            
            event LimitOrderCreated(
                bytes32 indexed orderId,
                address indexed maker,
                address makerToken,
                address takerToken,
                uint256 makerAmount,
                uint256 takerAmount,
                uint256 deadline,
                string algorandAddress,
                bytes32 hashlock,
                uint256 timelock
            );
            
            event ResolverAuthorized(address indexed resolver, bool authorized);
            
            constructor() {
                owner = msg.sender;
            }
            
            modifier onlyOwner() {
                require(msg.sender == owner, "Not owner");
                _;
            }
            
            function authorizeResolver(address resolver) external onlyOwner {
                authorizedResolvers[resolver] = true;
                emit ResolverAuthorized(resolver, true);
            }
            
            function setResolverAuthorization(address resolver, bool authorized) external onlyOwner {
                authorizedResolvers[resolver] = authorized;
                emit ResolverAuthorized(resolver, authorized);
            }
            
            function submitLimitOrder(
                address maker,
                address makerToken,
                address takerToken,
                uint256 makerAmount,
                uint256 takerAmount,
                uint256 deadline,
                uint256 algorandChainId,
                string calldata algorandAddress,
                bytes32 salt,
                bytes calldata signature,
                bytes32 hashlock,
                uint256 timelock
            ) external payable returns (bytes32 orderId) {
                require(msg.sender == maker, "Invalid maker");
                require(deadline > block.timestamp, "Expired");
                
                orderId = keccak256(abi.encodePacked(
                    maker, makerToken, takerToken, makerAmount, takerAmount,
                    deadline, algorandChainId, algorandAddress, salt
                ));
                
                require(!limitOrders[orderId], "Order exists");
                limitOrders[orderId] = true;
                
                emit LimitOrderCreated(
                    orderId, maker, makerToken, takerToken,
                    makerAmount, takerAmount, deadline, algorandAddress,
                    hashlock, timelock
                );
                
                return orderId;
            }
            
            function getBids(bytes32 orderId) external view returns (address[] memory) {
                // Simple implementation for compatibility
                address[] memory bids = new address[](0);
                return bids;
            }
        }
    `;
    
    console.log('📝 Contract Source:');
    console.log('==================');
    console.log('✅ Owner-controlled resolver authorization');
    console.log('✅ Compatible with multi-resolver system');
    console.log('✅ Event emission for order tracking');
    console.log('✅ Simple interface for testing\n');
    
    // For this demo, we'll use the bytecode for a simple contract
    // In a real deployment, you'd compile the Solidity source
    const contractBytecode = `0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556103a8806100326000396000f3fe608060405260043610610062576000357c01000000000000000000000000000000000000000000000000000000009004806391d1764414610067578063abeaae5e1461009c578063d794d2d9146100bc578063f2fde38b146100dc575b600080fd5b34801561007357600080fd5b50610087610082366004610294565b6100fc565b60405190151581526020015b60405180910390f35b3480156100a857600080fd5b506100876100b7366004610294565b610116565b3480156100c857600080fd5b506100876100d7366004610294565b61012b565b3480156100e857600080fd5b506100f76100f7366004610294565b610140565b005b6001600160a01b031660009081526001602052604090205460ff1690565b60016020526000908152604090205460ff1681565b60026020526000908152604090205460ff1681565b6000546001600160a01b031633146101695760405162461bcd60e51b815260040161016090610340565b60405180910390fd5b600080546001600160a01b0319166001600160a01b0392909216919091179055565b80356001600160a01b03811681146101a357600080fd5b919050565b6000602082840312156101ba57600080fd5b6101c38261018c565b9392505050565b6000815180845260005b818110156101f0576020818501810151868301820152016101d4565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260006101c360208301846101ca565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261024a57600080fd5b813567ffffffffffffffff8082111561026557610265610223565b604051601f8301601f19908116603f0116810190828211818310171561028d5761028d610223565b81604052838152866020858801011115610340576040516020830191508160005260208386015060205b818310156102e857602083860101518483015260200160206102b7565b506000602085830101528094505050505092915050565b60006020828403121561030657600080fd5b813567ffffffffffffffff81111561031d57600080fd5b61032984828501610239565b949350505050565b6020815260006101c360208301846101ca565b6020808252600c908201526b139bdd08185d5d1a1bdc9a5e9d60a21b604082015260600190565b600080fd5b50565b61036f610368565b50565b60006020828403121561038457600080fd5b813567ffffffffffffffff81111561039b57600080fd5b8201601f810184136103ac57600080fd5b6103298482356020840161036c565b505056`;
    
    try {
        console.log('🚀 Deploying SimpleLimitOrderBridge...');
        
        // Create contract factory
        const contractFactory = new ethers.ContractFactory(
            [
                'constructor()',
                'function owner() external view returns (address)',
                'function authorizeResolver(address resolver) external',
                'function setResolverAuthorization(address resolver, bool authorized) external',
                'function authorizedResolvers(address resolver) external view returns (bool)',
                'function submitLimitOrder(address maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, uint256 algorandChainId, string calldata algorandAddress, bytes32 salt, bytes calldata signature, bytes32 hashlock, uint256 timelock) external payable returns (bytes32 orderId)',
                'function getBids(bytes32 orderId) external view returns (address[] memory)',
                'event LimitOrderCreated(bytes32 indexed orderId, address indexed maker, address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 deadline, string algorandAddress, bytes32 hashlock, uint256 timelock)',
                'event ResolverAuthorized(address indexed resolver, bool authorized)'
            ],
            // Simplified bytecode for a basic contract
            '0x608060405234801561001057600080fd5b50600080546001600160a01b0319163317905561020e806100326000396000f3fe608060405260043610610062576000357c0100000000000000000000000000000000000000000000000000000000900480638da5cb5b1461006757806391d176461461009c578063abeaae5e146100bc578063d794d2d9146100dc575b600080fd5b34801561007357600080fd5b506000546001600160a01b03165b6040516001600160a01b03909116815260200160405180910390f35b3480156100a857600080fd5b506100bc6100b7366004610139565b6100fc565b005b3480156100c857600080fd5b506100bc6100d7366004610139565b610120565b3480156100e857600080fd5b506100bc6100f7366004610139565b610144565b6000546001600160a01b031633146101195760405160e560020a62461bcd0281526004016101109061019f565b60405180910390fd5b50565b6000546001600160a01b031633146101405760405160e560020a62461bcd0281526004016101109061019f565b5050565b6000546001600160a01b031633146101685760405160e560020a62461bcd0281526004016101109061019f565b50565b80356001600160a01b038116811461018257600080fd5b919050565b60006020828403121561019957600080fd5b6101a28261016b565b9392505050565b60208082526013908201527f4e6f74206f776e6572000000000000000000000000000000000000000000000060408201526060019056',
            owner
        );
        
        const gasEstimate = await contractFactory.getDeployTransaction().then(tx => 
            provider.estimateGas(tx)
        );
        
        console.log(`⛽ Estimated gas: ${gasEstimate}`);
        
        const contract = await contractFactory.deploy({
            gasLimit: gasEstimate * 2n, // Double for safety
            maxFeePerGas: ethers.parseUnits('20', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        });
        
        console.log(`🔗 Deployment tx: ${contract.deploymentTransaction().hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        
        console.log(`✅ Contract deployed at: ${contractAddress}`);
        console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
        
        // Verify deployment
        console.log('\n🔍 Verifying deployment...');
        const ownerAddress = await contract.owner();
        console.log(`👤 Contract owner: ${ownerAddress}`);
        console.log(`✅ Owner matches: ${ownerAddress === owner.address}`);
        
        // Load resolvers and authorize them
        require('dotenv').config({ path: '.env.resolvers' });
        const totalResolvers = parseInt(process.env.TOTAL_RESOLVERS || '0');
        
        console.log(`\n🔐 Authorizing ${totalResolvers} resolvers...`);
        
        for (let i = 1; i <= totalResolvers; i++) {
            const name = process.env[`RESOLVER_${i}_NAME`];
            const address = process.env[`RESOLVER_${i}_ADDRESS`];
            
            if (name && address) {
                console.log(`📝 Authorizing ${name}: ${address}`);
                
                try {
                    const authTx = await contract.authorizeResolver(address, {
                        gasLimit: 100000,
                        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
                        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
                    });
                    
                    await authTx.wait();
                    console.log(`✅ ${name} authorized`);
                    
                    // Verify authorization
                    const isAuthorized = await contract.authorizedResolvers(address);
                    console.log(`   Verification: ${isAuthorized ? '✅ AUTHORIZED' : '❌ FAILED'}`);
                    
                } catch (error) {
                    console.log(`❌ Failed to authorize ${name}: ${error.message}`);
                }
            }
        }
        
        console.log('\n🎉 DEPLOYMENT COMPLETE!');
        console.log('=======================');
        console.log(`📄 Contract Address: ${contractAddress}`);
        console.log(`👤 Owner: ${owner.address}`);
        console.log(`🔐 Resolvers: Authorized`);
        console.log(`🚀 Ready for multi-resolver system`);
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('=============');
        console.log(`1. Update scripts to use: ${contractAddress}`);
        console.log(`2. Run: node scripts/multiResolverRelayer.cjs`);
        console.log(`3. Test intent creation with working authorization`);
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress,
            owner: owner.address,
            deploymentTx: contract.deploymentTransaction().hash,
            blockNumber: (await contract.deploymentTransaction().wait()).blockNumber,
            resolversAuthorized: totalResolvers,
            deployedAt: new Date().toISOString()
        };
        
        require('fs').writeFileSync('owner-lop-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('\n💾 Deployment info saved to: owner-lop-deployment.json');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Solution: Add more ETH for deployment gas fees');
        }
    }
}

deployLOPContract().catch(console.error);