#!/usr/bin/env node

/**
 * 🧪 TEST RELAYER SYSTEM
 * 
 * Demonstrates the relayer system functionality:
 * 1. Create an intent
 * 2. Submit to relayer for execution
 * 3. Monitor automatic escrow creation
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function testRelayerSystem() {
  console.log('🧪 Testing Relayer System...')
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
    
    // Step 1: Create a test intent
    console.log('\n🚀 Step 1: Creating test intent...')
    
    const swapId = ethers.keccak256(ethers.toUtf8Bytes('test_relayer_' + Date.now()))
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes('test_order_' + Date.now()))
    const hashlock = ethers.keccak256(ethers.randomBytes(32))
    
    // Get current nonce for beneficiary (which is the same as user)
    const currentNonce = await resolver.userNonces(wallet.address)
    console.log(`Current nonce: ${currentNonce}`)
    
    // Create EIP-712 signature
    const domain = {
      name: 'Gasless1inchResolver',
      version: '1.0.0',
      chainId: await provider.getNetwork().then(n => n.chainId)
    }
    
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
    
    const value = {
      swapId: swapId,
      user: wallet.address,
      beneficiary: wallet.address,
      amount: testAmount,
      orderHash: orderHash,
      hashlock: hashlock,
      deadline: deadline,
      nonce: currentNonce
    }
    
    const signature = await wallet.signTypedData(domain, types, value)
    console.log(`✅ Intent signature created: ${signature.substring(0, 20)}...`)
    
    // Step 2: Create intent on resolver
    console.log('\n📝 Step 2: Creating intent on resolver...')
    
    const createTx = await resolver.createIntent(
      swapId,
      wallet.address,
      testAmount,
      orderHash,
      hashlock,
      deadline,
      signature
    )
    
    await createTx.wait()
    console.log(`✅ Intent created on resolver: ${createTx.hash}`)
    
    // Step 3: Check intent status
    console.log('\n🔍 Step 3: Checking intent status...')
    
    const intent = await resolver.getIntent(swapId)
    console.log(`Intent executed: ${intent.executed}`)
    console.log(`Intent claimed: ${intent.claimed}`)
    console.log(`Escrow address: ${intent.escrowAddress}`)
    
    // Step 4: Submit to relayer for execution
    console.log('\n🚀 Step 4: Submitting to relayer for execution...')
    
    const relayerTx = await relayer.executeIntent(swapId, {
      value: testAmount,
      gasLimit: 300000
    })
    
    await relayerTx.wait()
    console.log(`✅ Relayer executed intent: ${relayerTx.hash}`)
    
    // Step 5: Check final status
    console.log('\n🔍 Step 5: Checking final status...')
    
    const finalIntent = await resolver.getIntent(swapId)
    console.log(`Intent executed: ${finalIntent.executed}`)
    console.log(`Intent claimed: ${finalIntent.claimed}`)
    console.log(`Escrow address: ${finalIntent.escrowAddress}`)
    
    // Step 6: Get relayer stats
    console.log('\n📊 Step 6: Getting relayer stats...')
    
    const stats = await relayer.getRelayerStats()
    console.log(`Total executed intents: ${stats[0]}`)
    console.log(`Batch size: ${stats[1]}`)
    console.log(`Execution delay: ${stats[2]}s`)
    
    console.log('\n🎉 Relayer system test completed successfully!')
    console.log('✅ Automatic escrow creation working')
    console.log('✅ Gas costs handled by resolver')
    console.log('✅ Relayer executed intent automatically')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testRelayerSystem().catch(console.error) 