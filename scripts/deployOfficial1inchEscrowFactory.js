#!/usr/bin/env node

/**
 * Deploy Official 1inch EscrowFactory Contract
 * 
 * This script compiles and deploys the Official1inchEscrowFactory contract
 * to Sepolia testnet for use in cross-chain atomic swaps
 */

import { ethers } from 'ethers'
import fs from 'fs'
import solc from 'solc'
import dotenv from 'dotenv'

dotenv.config()

async function deployOfficial1inchEscrowFactory() {
  console.log('🏭 DEPLOYING OFFICIAL 1INCH ESCROWFACTORY')
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
    // Read and compile the contract
    console.log('\\n📋 Compiling Official1inchEscrowFactory...')
    
    const contractSource = fs.readFileSync('./contracts/Official1inchEscrowFactory.sol', 'utf8')
    
    const input = {
      language: 'Solidity',
      sources: {
        'Official1inchEscrowFactory.sol': {
          content: contractSource
        }
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
      compiled.errors.forEach(error => console.log(error.formattedMessage))
    }
    
    const contract = compiled.contracts['Official1inchEscrowFactory.sol']['Official1inchEscrowFactory']
    
    if (!contract) {
      throw new Error('Failed to compile Official1inchEscrowFactory')
    }
    
    console.log('✅ Contract compiled successfully')
    
    // Deploy the contract
    console.log('\\n🚀 Deploying Official1inchEscrowFactory...')
    
    const factory = new ethers.ContractFactory(
      contract.abi,
      contract.evm.bytecode.object,
      signer
    )
    
    const deployTx = await factory.deploy({
      gasLimit: 3000000
    })
    
    console.log(`📍 Deployment TX: ${deployTx.deploymentTransaction().hash}`)
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${deployTx.deploymentTransaction().hash}`)
    
    // Wait for deployment
    console.log('⏳ Waiting for deployment confirmation...')
    const deployedContract = await deployTx.waitForDeployment()
    const contractAddress = await deployedContract.getAddress()
    
    console.log('\\n✅ DEPLOYMENT SUCCESSFUL!')
    console.log(`📍 Contract Address: ${contractAddress}`)
    console.log(`🔗 Contract Explorer: https://sepolia.etherscan.io/address/${contractAddress}`)
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      deploymentTxHash: deployTx.deploymentTransaction().hash,
      network: network.name,
      chainId: Number(network.chainId),
      deployer: signer.address,
      deployedAt: new Date().toISOString(),
      gasUsed: (await deployTx.deploymentTransaction().wait()).gasUsed.toString(),
      abi: contract.abi,
      features: [
        'Official 1inch EscrowFactory',
        'Cross-chain Atomic Swaps',
        'CREATE2 Deterministic Escrows',
        'Secret-based Resolution',
        'Timelock Protection'
      ]
    }
    
    fs.writeFileSync(
      './official-1inch-escrow-factory-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    )
    
    console.log('\\n📊 DEPLOYMENT SUMMARY:')
    console.log(`🏭 Official 1inch EscrowFactory: ${contractAddress}`)
    console.log(`⛽ Gas Used: ${deploymentInfo.gasUsed}`)
    console.log(`💰 Deployment Cost: ${ethers.formatEther((await deployTx.deploymentTransaction().wait()).gasUsed * (await deployTx.deploymentTransaction().wait()).gasPrice || 0)} ETH`)
    console.log(`📋 Saved to: ./official-1inch-escrow-factory-deployment.json`)
    
    // Test the deployed contract
    console.log('\\n🧪 TESTING DEPLOYED CONTRACT...')
    
    // Test isValidResolver
    const isValid = await deployedContract.isValidResolver(signer.address)
    console.log(`✅ isValidResolver test: ${isValid}`)
    
    // Test getEscrow (should return zero address for non-existent escrow)
    const testOrderHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
    const escrowAddress = await deployedContract.getEscrow(testOrderHash)
    console.log(`✅ getEscrow test: ${escrowAddress}`)
    
    console.log('\\n🎉 OFFICIAL 1INCH ESCROWFACTORY DEPLOYMENT COMPLETE!')
    console.log('🔗 Ready for cross-chain atomic swaps!')
    
    return {
      address: contractAddress,
      abi: contract.abi,
      deploymentInfo
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployOfficial1inchEscrowFactory().then((result) => {
    console.log('\\n✅ Script completed successfully!')
  }).catch(error => {
    console.error('\\n💥 Script failed:', error.message)
    process.exit(1)
  })
}

export default deployOfficial1inchEscrowFactory