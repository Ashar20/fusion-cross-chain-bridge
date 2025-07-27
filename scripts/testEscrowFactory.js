#!/usr/bin/env node

/**
 * Test Official 1inch EscrowFactory
 * Simple test to debug why escrow creation is failing
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

async function testEscrowFactory() {
  console.log('🧪 TESTING OFFICIAL 1INCH ESCROWFACTORY')
  console.log('=' .repeat(50))
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  const factoryAddress = '0x0d8137727DB1aC0f7B10f7687D734CD027921bf6'
  
  const factory = new ethers.Contract(
    factoryAddress,
    [
      "function createEscrow(address token, uint256 amount, bytes32 orderHash, uint256 deadline, bytes calldata resolverCalldata) external payable returns (address escrow)",
      "function getEscrow(bytes32 orderHash) external view returns (address)",
      "function isValidResolver(address resolver) external pure returns (bool)"
    ],
    signer
  )
  
  try {
    console.log('📋 Testing basic contract calls...')
    
    // Test isValidResolver
    const isValid = await factory.isValidResolver(signer.address)
    console.log(`✅ isValidResolver: ${isValid}`)
    
    // Test getEscrow for non-existent order
    const testHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
    const escrow = await factory.getEscrow(testHash)
    console.log(`✅ getEscrow: ${escrow}`)
    
    // Now test createEscrow with minimal parameters
    console.log('\\n📋 Testing createEscrow...')
    
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes('test-order'))
    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour
    const amount = ethers.parseEther('0.001') // Small amount
    
    console.log(`Order Hash: ${orderHash}`)
    console.log(`Deadline: ${deadline}`)
    console.log(`Amount: ${ethers.formatEther(amount)} ETH`)
    
    // Try with low gas first to see if it's a gas issue
    const gasEstimate = await factory.createEscrow.estimateGas(
      ethers.ZeroAddress, // ETH
      amount,
      orderHash,
      deadline,
      '0x', // empty resolver data
      { value: amount }
    )
    
    console.log(`⛽ Gas estimate: ${gasEstimate}`)
    
    const tx = await factory.createEscrow(
      ethers.ZeroAddress, // ETH
      amount,
      orderHash,
      deadline,
      '0x', // empty resolver data
      { 
        value: amount,
        gasLimit: gasEstimate * 2n // Double the estimate
      }
    )
    
    console.log(`✅ Transaction sent: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
    
    // Get the escrow address
    const createdEscrow = await factory.getEscrow(orderHash)
    console.log(`🏠 Created escrow: ${createdEscrow}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.data) {
      console.error('📋 Error data:', error.data)
    }
    
    if (error.reason) {
      console.error('📋 Error reason:', error.reason)
    }
  }
}

testEscrowFactory()