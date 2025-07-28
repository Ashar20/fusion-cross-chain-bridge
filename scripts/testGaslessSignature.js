#!/usr/bin/env node

/**
 * 🔍 TEST GASLESS SIGNATURE
 * 
 * Debug EIP-712 signature creation and verification
 */

import { ethers } from 'ethers'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

async function testGaslessSignature() {
  console.log('🔍 TESTING GASLESS SIGNATURE')
  console.log('=' .repeat(50))
  
  try {
    // Initialize provider and signer
    const ethProvider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    const ethSigner = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider)
    
    console.log('👤 Signer address:', ethSigner.address)
    
    // Load deployment info
    const deployment = JSON.parse(fs.readFileSync('gasless-resolver-deployment.json', 'utf8'))
    const resolverAddress = deployment.gaslessResolver.address
    
    // Load contract ABI
    const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json', 'utf8'))
    const resolver = new ethers.Contract(resolverAddress, artifact.abi, ethSigner)
    
    // EIP-712 domain
    const domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: 11155111, // Sepolia
      verifyingContract: resolverAddress
    }
    
    // EIP-712 types
    const types = {
      Intent: [
        { name: 'swapId', type: 'bytes32' },
        { name: 'user', type: 'address' },
        { name: 'beneficiary', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'orderHash', type: 'bytes32' },
        { name: 'hashlock', type: 'bytes32' },
        { name: 'deadline', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ]
    }
    
    // Test parameters
    const swapId = ethers.keccak256(ethers.randomBytes(32))
    const beneficiary = ethSigner.address
    const amount = ethers.parseEther('0.001')
    const orderHash = ethers.keccak256(ethers.randomBytes(32))
    const hashlock = ethers.keccak256(ethers.randomBytes(32))
    const deadline = Math.floor(Date.now() / 1000) + 3600
    
    // Get nonce
    const nonce = await resolver.userNonces(beneficiary)
    console.log('📊 Current nonce:', nonce.toString())
    
    // Create message
    const message = {
      swapId,
      user: beneficiary,
      beneficiary,
      amount: amount.toString(),
      orderHash,
      hashlock,
      deadline,
      nonce
    }
    
    console.log('📝 Message:', message)
    
    // Sign message
    const signature = await ethSigner.signTypedData(domain, { Intent: types.Intent }, message)
    console.log('🔐 Signature:', signature)
    
    // Try to create intent
    console.log('📝 Creating intent...')
    const tx = await resolver.createIntent(
      swapId,
      beneficiary,
      amount,
      orderHash,
      hashlock,
      deadline,
      signature
    )
    
    console.log('✅ Intent created!')
    console.log('📄 Transaction:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('📊 Gas used:', receipt.gasUsed.toString())
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    throw error
  }
}

testGaslessSignature()
  .then(() => {
    console.log('\n🎉 Signature test successful!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Signature test failed:', error.message)
    process.exit(1)
  }) 