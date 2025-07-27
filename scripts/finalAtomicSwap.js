#!/usr/bin/env node

/**
 * 🔄 FINAL ATOMIC SWAP COMPLETION
 * 
 * Completes the atomic swap with the exact escrow ID
 */

import { ethers } from 'ethers'
import { RealEOSIntegration } from '../lib/realEOSIntegration.js'
import dotenv from 'dotenv'

dotenv.config()

// Exact details from transaction inspection
const CONTRACT_ADDRESS = '0x583F57CA7b2AEdaF2A34480C70BD22764d72AaD2'
const ESCROW_ID = '0x9b047961bc3758cccca21a85d073d955a37135cce9090d9aea2b96756a502e7d'
const SECRET = '0x629bdb0a46c8f211efa5b9326a14a800795e4bf02de79911cf6489d57dc7090f'

const CONTRACT_ABI = [
  "function withdrawWithSecret(bytes32 _escrowId, bytes32 _secret) external returns (bool)",
  "function getEscrow(bytes32 _escrowId) external view returns (tuple(address initiator, address recipient, address resolver, uint256 amount, bytes32 hashlock, uint256 timelock, bool withdrawn, bool refunded))",
  "event HTLCSecretRevealed(bytes32 indexed escrowId, bytes32 indexed secret)",
  "event HTLCWithdrawn(bytes32 indexed escrowId, address indexed recipient, uint256 amount)"
]

async function completeAtomicSwap() {
  console.log('🔄 FINAL ATOMIC SWAP COMPLETION')
  console.log('=' .repeat(60))
  console.log('⚠️  This will reveal the secret and claim your ETH!')
  console.log('')

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  
  console.log(`👤 Signer: ${signer.address}`)
  console.log(`📋 Contract: ${CONTRACT_ADDRESS}`)
  console.log(`🔑 Escrow ID: ${ESCROW_ID}`)
  console.log(`🔐 Secret: ${SECRET}`)
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  
  try {
    console.log('\n🔍 STEP 1: VERIFYING ESCROW DETAILS')
    console.log('-' .repeat(50))
    
    const escrowDetails = await contract.getEscrow(ESCROW_ID)
    
    console.log('📋 Escrow Details:')
    console.log(`  Initiator: ${escrowDetails.initiator}`)
    console.log(`  Recipient: ${escrowDetails.recipient}`)
    console.log(`  Resolver: ${escrowDetails.resolver}`)
    console.log(`  Amount: ${ethers.formatEther(escrowDetails.amount)} ETH`)
    console.log(`  Hashlock: ${escrowDetails.hashlock}`)
    console.log(`  Timelock: ${new Date(Number(escrowDetails.timelock) * 1000).toISOString()}`)
    console.log(`  Withdrawn: ${escrowDetails.withdrawn}`)
    console.log(`  Refunded: ${escrowDetails.refunded}`)
    
    // Verify the hashlock matches our secret
    const computedHash = ethers.keccak256(SECRET)
    console.log('\n🔐 Secret Verification:')
    console.log(`  Expected: ${escrowDetails.hashlock}`)
    console.log(`  Computed: ${computedHash}`)
    console.log(`  Match: ${computedHash === escrowDetails.hashlock ? '✅ YES' : '❌ NO'}`)
    
    if (computedHash !== escrowDetails.hashlock) {
      throw new Error('Secret does not match hashlock!')
    }
    
    if (escrowDetails.withdrawn) {
      console.log('⚠️  Escrow already withdrawn!')
      return { success: false, reason: 'Already withdrawn' }
    }
    
    if (escrowDetails.refunded) {
      console.log('⚠️  Escrow already refunded!')
      return { success: false, reason: 'Already refunded' }
    }
    
    // Check if timelock has expired
    const now = Math.floor(Date.now() / 1000)
    const timeRemaining = Number(escrowDetails.timelock) - now
    console.log(`\n⏰ Time Check:`)
    console.log(`  Current time: ${new Date().toISOString()}`)
    console.log(`  Expires at: ${new Date(Number(escrowDetails.timelock) * 1000).toISOString()}`)
    console.log(`  Time remaining: ${timeRemaining} seconds (${(timeRemaining / 3600).toFixed(2)} hours)`)
    
    if (now >= Number(escrowDetails.timelock)) {
      throw new Error('Escrow has expired! Use refund function instead.')
    }
    
    console.log('\n💰 STEP 2: EXECUTING WITHDRAWAL')
    console.log('-' .repeat(50))
    console.log(`  Amount to claim: ${ethers.formatEther(escrowDetails.amount)} ETH`)
    console.log(`  Recipient wallet: ${escrowDetails.recipient}`)
    
    // Get balance before withdrawal
    const balanceBefore = await provider.getBalance(escrowDetails.recipient)
    console.log(`  Balance before: ${ethers.formatEther(balanceBefore)} ETH`)
    
    // Execute withdrawal
    console.log('\n🔄 Broadcasting withdrawal transaction...')
    const withdrawTx = await contract.withdrawWithSecret(ESCROW_ID, SECRET, {
      gasLimit: 300000
    })
    
    console.log('✅ Withdrawal transaction broadcast!')
    console.log(`📍 TX Hash: ${withdrawTx.hash}`)
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${withdrawTx.hash}`)
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...')
    const receipt = await withdrawTx.wait()
    console.log('✅ Transaction confirmed!')
    console.log(`📦 Block: ${receipt.blockNumber}`)
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`)
    
    // Check balance after withdrawal
    const balanceAfter = await provider.getBalance(escrowDetails.recipient)
    const netGained = balanceAfter - balanceBefore - (receipt.gasUsed * receipt.gasPrice)
    
    console.log('\n💰 BALANCE UPDATE:')
    console.log(`  Balance after: ${ethers.formatEther(balanceAfter)} ETH`)
    console.log(`  Gas cost: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice)} ETH`)
    console.log(`  NET GAINED: ${ethers.formatEther(netGained)} ETH`)
    
    // Parse withdrawal events
    let secretRevealed = false
    let amountWithdrawn = null
    
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log)
        if (parsedLog.name === 'HTLCSecretRevealed') {
          console.log(`🔓 Secret revealed in transaction: ${parsedLog.args.secret}`)
          secretRevealed = true
        }
        if (parsedLog.name === 'HTLCWithdrawn') {
          amountWithdrawn = parsedLog.args.amount
          console.log(`💰 Confirmed withdrawal: ${ethers.formatEther(parsedLog.args.amount)} ETH`)
          console.log(`👤 Confirmed recipient: ${parsedLog.args.recipient}`)
        }
      } catch (e) {
        // Ignore unparseable logs
      }
    }
    
    console.log('\n🌴 STEP 3: CLAIMING EOS WITH REVEALED SECRET')
    console.log('-' .repeat(50))
    
    // Initialize EOS integration
    const eosIntegration = new RealEOSIntegration({
      rpcUrl: process.env.EOS_RPC_URL,
      account: process.env.EOS_ACCOUNT,
      privateKey: process.env.EOS_PRIVATE_KEY
    })
    await eosIntegration.initialize()
    
    // Claim EOS with the revealed secret
    console.log('🔄 Claiming EOS with revealed secret...')
    const eosClaimResult = await eosIntegration.claimRealEOSHTLC({
      htlcId: 'eos_753357553d7a2b382ec5be3a395bb01d3aea859693945137d55cce9ba356be22',
      secret: SECRET,
      claimer: 'silaslist123'
    })
    
    console.log('✅ EOS claim completed!')
    console.log(`📍 EOS TX: ${eosClaimResult.transaction_id}`)
    console.log(`🔗 Explorer: ${eosIntegration.getEOSExplorerLink(eosClaimResult.transaction_id)}`)
    
    console.log('\n' + '=' .repeat(70))
    console.log('🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(70))
    
    console.log('\n📊 FINAL SUMMARY:')
    console.log(`✅ ETH Withdrawn: ${ethers.formatEther(escrowDetails.amount)} ETH`)
    console.log(`✅ ETH Recipient: ${escrowDetails.recipient}`)
    console.log(`✅ NET ETH Gained: ${ethers.formatEther(netGained)} ETH`)
    console.log(`✅ EOS Claimed: 25.0000 EOS`) 
    console.log(`✅ EOS Recipient: silaslist123`)
    console.log(`✅ Secret Revealed: ${SECRET}`)
    console.log(`✅ Escrow ID: ${ESCROW_ID}`)
    
    console.log('\n🔗 TRANSACTION LINKS:')
    console.log(`📍 ETH Escrow Creation: https://sepolia.etherscan.io/tx/0xebac80c3e2b0768fd7faabe2cd752fdc7cd3f99fe42da0947ee79c0803efdb57`)
    console.log(`📍 ETH Withdrawal: https://sepolia.etherscan.io/tx/${withdrawTx.hash}`)
    console.log(`📍 EOS Claim: ${eosIntegration.getEOSExplorerLink(eosClaimResult.transaction_id)}`)
    console.log(`📍 Contract: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`)
    
    console.log('\n🏆 CROSS-CHAIN ATOMIC SWAP STATUS: SUCCESS ✅')
    console.log(`💰 YOU SUCCESSFULLY RECEIVED ${ethers.formatEther(escrowDetails.amount)} ETH!`)
    console.log(`🌴 YOU SUCCESSFULLY RECEIVED 25.0000 EOS!`)
    
    return {
      success: true,
      ethWithdrawal: {
        txHash: withdrawTx.hash,
        amount: ethers.formatEther(escrowDetails.amount),
        netGained: ethers.formatEther(netGained),
        recipient: escrowDetails.recipient,
        escrowId: ESCROW_ID
      },
      eosClaim: {
        txId: eosClaimResult.transaction_id,
        amount: '25.0000 EOS',
        recipient: 'silaslist123'
      },
      secretRevealed: SECRET
    }
    
  } catch (error) {
    console.error('❌ Atomic swap completion failed:', error.message)
    throw error
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeAtomicSwap().then((result) => {
    if (result && result.success) {
      console.log('\n🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!')
      console.log('🏆 Your cross-chain swap is now complete!')
    }
  }).catch(error => {
    console.error('\n💥 ATOMIC SWAP FAILED:', error.message)
    process.exit(1)
  })
}

export default completeAtomicSwap