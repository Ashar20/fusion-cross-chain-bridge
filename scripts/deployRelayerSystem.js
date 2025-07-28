#!/usr/bin/env node

/**
 * 🚀 DEPLOY SIMPLIFIED RELAYER SYSTEM
 * 
 * Deploys the simplified relayer system:
 * 1. RelayerSystem contract (no gas handling)
 * 2. Configures with existing resolver
 * 3. Sets up automatic escrow creation
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function deployRelayerSystem() {
  console.log('🚀 Deploying Simplified Relayer System...')
  console.log('=' .repeat(60))
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  console.log(`🔑 Deployer: ${deployer.address}`)
  console.log(`🌐 Network: ${(await provider.getNetwork()).name}`)
  
  // Contract addresses (from previous deployments)
  const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a'
  
  console.log(`📍 Resolver: ${resolverAddress}`)
  console.log(`💡 Gas costs handled by resolver, not relayer`)
  
  try {
    // Load contract bytecode and ABI
    const relayerArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/RelayerSystem.sol/RelayerSystem.json', 'utf8'))
    
    // Create contract factory
    const RelayerSystem = new ethers.ContractFactory(
      relayerArtifact.abi,
      relayerArtifact.bytecode,
      deployer
    )
    
    console.log('\n📦 Deploying RelayerSystem contract...')
    
    // Deploy with constructor parameters
    const relayer = await RelayerSystem.deploy(
      resolverAddress,
      deployer.address // relayer owner
    )
    
    await relayer.waitForDeployment()
    const relayerAddress = await relayer.getAddress()
    
    console.log('✅ RelayerSystem deployed successfully!')
    console.log(`📍 Address: ${relayerAddress}`)
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${relayerAddress}`)
    
    // Configure relayer parameters
    console.log('\n⚙️ Configuring relayer parameters...')
    
    const batchSize = 10
    const executionDelay = 0
    
    const configTx = await relayer.updateConfig(batchSize, executionDelay)
    await configTx.wait()
    
    console.log('✅ Relayer configuration updated!')
    console.log(`📦 Batch size: ${batchSize}`)
    console.log(`⏰ Execution delay: ${executionDelay}s`)
    console.log(`💡 Resolver handles gas costs automatically`)
    
    // Save deployment info
    const deploymentInfo = {
      relayerSystem: {
        address: relayerAddress,
        deploymentTxHash: relayer.deploymentTransaction().hash,
        resolver: resolverAddress,
        owner: deployer.address,
        config: {
          batchSize: batchSize,
          executionDelay: executionDelay
        }
      },
      deploymentTime: new Date().toISOString(),
      network: (await provider.getNetwork()).name,
      deployer: deployer.address,
      note: "Gas costs handled by resolver, not relayer"
    }
    
    fs.writeFileSync(
      'relayer-system-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    )
    
    console.log('\n📄 Deployment info saved to relayer-system-deployment.json')
    
    console.log('\n🎉 Simplified Relayer System deployment complete!')
    console.log('\n📋 Key Features:')
    console.log('✅ Automatic escrow creation')
    console.log('✅ Batch processing for efficiency')
    console.log('✅ Gas costs handled by resolver')
    console.log('✅ No duplicate gas handling logic')
    
    console.log('\n📋 Next steps:')
    console.log('1. Update relayer address in scripts/relayerService.js')
    console.log('2. Start the relayer service: node scripts/relayerService.js')
    console.log('3. Monitor automatic escrow creation')
    console.log('4. Resolver handles all gas costs automatically')
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Run deployment
deployRelayerSystem().catch(console.error) 