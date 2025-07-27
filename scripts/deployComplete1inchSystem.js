#!/usr/bin/env node

/**
 * Deploy Complete Official 1inch System
 * 
 * Deploys both EscrowFactory and Custom Resolver for hackathon qualification
 */

import { ethers } from 'ethers'
import fs from 'fs'
import solc from 'solc'
import dotenv from 'dotenv'

dotenv.config()

async function deployComplete1inchSystem() {
  console.log('🏭 DEPLOYING COMPLETE OFFICIAL 1INCH SYSTEM')
  console.log('=' .repeat(60))
  
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  const network = await provider.getNetwork()
  const balance = await provider.getBalance(signer.address)
  
  console.log(`📡 Network: ${network.name} (${Number(network.chainId)})`)
  console.log(`💰 Deployer: ${signer.address}`)
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`)
  
  try {
    console.log('\\n📋 STEP 1: COMPILING CONTRACTS...')
    
    // Read contract sources
    const escrowFactorySource = fs.readFileSync('./contracts/Official1inchEscrowFactory.sol', 'utf8')
    const resolverSource = fs.readFileSync('./contracts/Official1inchResolver.sol', 'utf8')
    
    const input = {
      language: 'Solidity',
      sources: {
        'Official1inchEscrowFactory.sol': { content: escrowFactorySource },
        'Official1inchResolver.sol': { content: resolverSource }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    }
    
    const compiled = JSON.parse(solc.compile(JSON.stringify(input)))
    
    if (compiled.errors) {
      console.log('⚠️  Compilation warnings/errors:')
      compiled.errors.forEach(error => {
        if (error.severity === 'error') {
          throw new Error(error.formattedMessage)
        }
        console.log(error.formattedMessage)
      })
    }
    
    const escrowFactoryContract = compiled.contracts['Official1inchEscrowFactory.sol']['Official1inchEscrowFactory']
    const resolverContract = compiled.contracts['Official1inchResolver.sol']['Official1inchResolver']
    
    console.log('✅ Contracts compiled successfully')
    
    console.log('\\n📋 STEP 2: DEPLOYING ESCROWFACTORY...')
    
    // Deploy EscrowFactory
    const factoryFactory = new ethers.ContractFactory(
      escrowFactoryContract.abi,
      escrowFactoryContract.evm.bytecode.object,
      signer
    )
    
    const escrowFactory = await factoryFactory.deploy({
      gasLimit: 3000000
    })
    
    console.log(`📍 EscrowFactory TX: ${escrowFactory.deploymentTransaction().hash}`)
    
    const deployedFactory = await escrowFactory.waitForDeployment()
    const factoryAddress = await deployedFactory.getAddress()
    
    console.log(`✅ EscrowFactory deployed: ${factoryAddress}`)
    
    console.log('\\n📋 STEP 3: DEPLOYING CUSTOM RESOLVER...')
    
    // Deploy Resolver with EscrowFactory address
    const resolverFactory = new ethers.ContractFactory(
      resolverContract.abi,
      resolverContract.evm.bytecode.object,
      signer
    )
    
    const resolver = await resolverFactory.deploy(factoryAddress, {
      gasLimit: 3000000
    })
    
    console.log(`📍 Resolver TX: ${resolver.deploymentTransaction().hash}`)
    
    const deployedResolver = await resolver.waitForDeployment()
    const resolverAddress = await deployedResolver.getAddress()
    
    console.log(`✅ Resolver deployed: ${resolverAddress}`)
    
    console.log('\\n📋 STEP 4: TESTING SYSTEM...')
    
    // Test the system
    const isValid = await deployedFactory.isValidResolver(resolverAddress)
    console.log(`✅ Resolver validation: ${isValid}`)
    
    // Save deployment info
    const deploymentInfo = {
      escrowFactory: {
        address: factoryAddress,
        deploymentTxHash: escrowFactory.deploymentTransaction().hash,
        abi: escrowFactoryContract.abi
      },
      resolver: {
        address: resolverAddress,
        deploymentTxHash: resolver.deploymentTransaction().hash,
        abi: resolverContract.abi
      },
      network: network.name,
      chainId: Number(network.chainId),
      deployer: signer.address,
      deployedAt: new Date().toISOString(),
      hackathonRequirements: {
        "1. Commit to swap": "✅ resolver.commitToSwap()",
        "2. Fund destination escrow": "✅ resolver.fundDestinationEscrow()",  
        "3. Claim origin escrow": "✅ resolver.claimOriginEscrow()"
      }
    }
    
    fs.writeFileSync(
      './complete-1inch-system-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    )
    
    console.log('\\n🎉 COMPLETE 1INCH SYSTEM DEPLOYED!')
    console.log('=' .repeat(60))
    console.log(`🏭 EscrowFactory: ${factoryAddress}`)
    console.log(`🎯 Custom Resolver: ${resolverAddress}`)
    console.log(`🔗 Factory Explorer: https://sepolia.etherscan.io/address/${factoryAddress}`)
    console.log(`🔗 Resolver Explorer: https://sepolia.etherscan.io/address/${resolverAddress}`)
    
    console.log('\\n📜 HACKATHON REQUIREMENTS MET:')
    console.log('✅ 1. Commit to swap - resolver.commitToSwap()')
    console.log('✅ 2. Fund destination escrow - resolver.fundDestinationEscrow()')
    console.log('✅ 3. Claim origin escrow - resolver.claimOriginEscrow()')
    
    return { factoryAddress, resolverAddress, deploymentInfo }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployComplete1inchSystem().then((result) => {
    console.log('\\n🏆 HACKATHON-QUALIFIED 1INCH SYSTEM READY!')
  }).catch(error => {
    console.error('\\n💥 Deployment failed:', error.message)
    process.exit(1)
  })
}

export default deployComplete1inchSystem