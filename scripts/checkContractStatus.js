#!/usr/bin/env node

/**
 * 🔍 CHECK CONTRACT STATUS
 * 
 * Checks the deployed contract and authorizes resolver if needed
 */

import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

const CONTRACT_ADDRESS = '0x2C2e75cc8d8731234b1BA7bFd59C2417647c5CFF'
const CONTRACT_ABI = [
  "function setResolverAuthorization(address _resolver, bool _authorized) external",
  "function isResolverAuthorized(address _resolver) external view returns (bool)",
  "function owner() external view returns (address)",
  "function getOfficial1inchContracts() external pure returns (address settlement, address routerV5)"
]

async function checkContract() {
  console.log('🔍 CHECKING CONTRACT STATUS')
  console.log('=' .repeat(60))
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  console.log(`📋 Contract: ${CONTRACT_ADDRESS}`)
  console.log(`👤 Signer: ${signer.address}`)
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  
  try {
    // Check if we are the owner
    console.log('\n👑 Checking ownership...')
    const owner = await contract.owner()
    console.log(`Contract Owner: ${owner}`)
    console.log(`Our Address: ${signer.address}`)
    console.log(`Are we owner? ${owner.toLowerCase() === signer.address.toLowerCase()}`)
    
    // Check if we are authorized as resolver
    console.log('\n🔐 Checking resolver authorization...')
    const isAuthorized = await contract.isResolverAuthorized(signer.address)
    console.log(`Resolver authorized: ${isAuthorized}`)
    
    if (!isAuthorized) {
      console.log('\n⚡ Authorizing resolver...')
      const authTx = await contract.setResolverAuthorization(signer.address, true)
      console.log(`Authorization TX: ${authTx.hash}`)
      await authTx.wait()
      console.log('✅ Resolver authorized!')
      
      // Double-check
      const nowAuthorized = await contract.isResolverAuthorized(signer.address)
      console.log(`Now authorized: ${nowAuthorized}`)
    }
    
    // Check 1inch contracts
    console.log('\n🏭 Checking 1inch integration...')
    try {
      const [settlement, routerV5] = await contract.getOfficial1inchContracts()
      console.log(`Settlement: ${settlement}`)
      console.log(`Router V5: ${routerV5}`)
    } catch (e) {
      console.log('⚠️  1inch contracts not available in this contract')
    }
    
    console.log('\n✅ Contract status check complete!')
    
  } catch (error) {
    console.error('❌ Contract check failed:', error.message)
  }
}

checkContract()