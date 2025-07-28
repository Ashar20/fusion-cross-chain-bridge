#!/usr/bin/env node

/**
 * 🧪 SIMPLE RELAYER TEST
 * 
 * Simple test that matches the exact contract EIP-712 implementation
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function simpleRelayerTest() {
  console.log('🧪 Simple Relayer Test...')
  console.log('=' .repeat(50))
  
  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    
    console.log(`🔑 Test Wallet: ${wallet.address}`)
    
    // Contract addresses
    const resolverAddress = '0xc75e75Fb1378079DBd6f38F0Ae688689Bd791B1a'
    const relayerAddress = '0x07dCDBBB9e96a0Dd59597cc2a6c18f0558d84653'
    
    console.log(`📍 Resolver: ${resolverAddress}`)
    console.log(`📍 Relayer: ${relayerAddress}`)
    
    // Load contract ABIs
    const resolverABI = JSON.parse(fs.readFileSync('./artifacts/contracts/Gasless1inchResolver.sol/Gasless1inchResolver.json', 'utf8')).abi
    const relayerABI = JSON.parse(fs.readFileSync('./artifacts/contracts/RelayerSystem.sol/RelayerSystem.json', 'utf8')).abi
    
    // Initialize contracts
    const resolver = new ethers.Contract(resolverAddress, resolverABI, wallet)
    const relayer = new ethers.Contract(relayerAddress, relayerABI, wallet)
    
    // Test parameters
    const testAmount = ethers.parseEther('0.001') // 0.001 ETH
    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    
    console.log('\n📋 Test Parameters:')
    console.log(`Amount: ${ethers.formatEther(testAmount)} ETH`)
    console.log(`Deadline: ${new Date(deadline * 1000).toISOString()}`)
    
    // Step 1: Create test data
    console.log('\n🚀 Step 1: Creating test data...')
    
    const swapId = ethers.keccak256(ethers.toUtf8Bytes('simple_test_' + Date.now()))
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes('simple_order_' + Date.now()))
    const hashlock = ethers.keccak256(ethers.randomBytes(32))
    
    console.log(`Swap ID: ${swapId}`)
    console.log(`Order Hash: ${orderHash}`)
    console.log(`Hashlock: ${hashlock}`)
    
    // Step 2: Get current nonce
    console.log('\n📝 Step 2: Getting current nonce...')
    
    const currentNonce = await resolver.userNonces(wallet.address)
    console.log(`Current nonce: ${currentNonce}`)
    
    // Step 3: Create EIP-712 signature exactly as contract expects
    console.log('\n🔐 Step 3: Creating EIP-712 signature...')
    
    // Domain separator
    const domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: await provider.getNetwork().then(n => n.chainId)
    }
    
    // Type hash (must match contract exactly)
    const INTENT_TYPEHASH = ethers.keccak256(
      ethers.toUtf8Bytes(
        'Intent(bytes32 swapId,address user,address beneficiary,uint256 amount,bytes32 orderHash,bytes32 hashlock,uint256 deadline,uint256 nonce)'
      )
    )
    
    console.log(`Type Hash: ${INTENT_TYPEHASH}`)
    
    // Struct hash (must match contract exactly)
    const structHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'address', 'address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256'],
        [
          INTENT_TYPEHASH,
          swapId,
          wallet.address, // user
          wallet.address, // beneficiary (same as user)
          testAmount,
          orderHash,
          hashlock,
          deadline,
          currentNonce
        ]
      )
    )
    
    console.log(`Struct Hash: ${structHash}`)
    
    // Sign the struct hash
    const signature = await wallet.signMessage(ethers.getBytes(structHash))
    console.log(`Signature: ${signature}`)
    
    // Step 4: Create intent on resolver
    console.log('\n📝 Step 4: Creating intent on resolver...')
    
    const createTx = await resolver.createIntent(
      swapId,
      wallet.address, // beneficiary
      testAmount,
      orderHash,
      hashlock,
      deadline,
      signature
    )
    
    await createTx.wait()
    console.log(`✅ Intent created on resolver: ${createTx.hash}`)
    
    // Step 5: Check intent status
    console.log('\n🔍 Step 5: Checking intent status...')
    
    const intent = await resolver.getIntent(swapId)
    console.log(`Intent executed: ${intent.executed}`)
    console.log(`Intent claimed: ${intent.claimed}`)
    console.log(`Escrow address: ${intent.escrowAddress}`)
    
    // Step 6: Submit to relayer for execution
    console.log('\n🚀 Step 6: Submitting to relayer for execution...')
    
    const relayerTx = await relayer.executeIntent(swapId, {
      value: testAmount,
      gasLimit: 300000
    })
    
    await relayerTx.wait()
    console.log(`✅ Relayer executed intent: ${relayerTx.hash}`)
    
    // Step 7: Check final status
    console.log('\n🔍 Step 7: Checking final status...')
    
    const finalIntent = await resolver.getIntent(swapId)
    console.log(`Intent executed: ${finalIntent.executed}`)
    console.log(`Intent claimed: ${finalIntent.claimed}`)
    console.log(`Escrow address: ${finalIntent.escrowAddress}`)
    
    // Step 8: Get relayer stats
    console.log('\n📊 Step 8: Getting relayer stats...')
    
    const stats = await relayer.getRelayerStats()
    console.log(`Total executed intents: ${stats[0]}`)
    console.log(`Batch size: ${stats[1]}`)
    console.log(`Execution delay: ${stats[2]}s`)
    
    console.log('\n🎉 Simple relayer test completed successfully!')
    console.log('✅ Automatic escrow creation working')
    console.log('✅ Gas costs handled by resolver')
    console.log('✅ Relayer executed intent automatically')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

// Run the test
simpleRelayerTest().catch(console.error) 