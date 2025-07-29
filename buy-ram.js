import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

console.log('💰 BUYING RAM FOR EOS CONTRACT DEPLOYMENT')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY
}

async function buyRAM() {
  try {
    console.log('📡 Connecting to EOS blockchain...')
    
    // Initialize EOS.js
    const rpc = new JsonRpc(config.rpcUrl, { fetch })
    const signatureProvider = new JsSignatureProvider([config.privateKey])
    
    const api = new Api({
      rpc,
      signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
      chainId: config.chainId
    })

    // Check current account info
    console.log(`💰 Checking account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Current balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 Current RAM usage: ${accountInfo.ram_usage} bytes`)

    // Calculate RAM needed (approximately 50 EOS worth)
    const ramToBuy = 1000000 // 1MB of RAM (approximately 50 EOS)
    const eosAmount = '20.0000 EOS' // Use 20 EOS for RAM (leaving some for deployment)

    console.log(`🔄 Buying RAM...`)
    console.log(`📊 RAM to buy: ${ramToBuy} bytes`)
    console.log(`💰 EOS amount: ${eosAmount}`)

    // Buy RAM
    const buyRamResult = await api.transact({
      actions: [{
        account: 'eosio',
        name: 'buyram',
        authorization: [{
          actor: config.account,
          permission: 'active'
        }],
        data: {
          payer: config.account,
          receiver: config.account,
          quant: eosAmount
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })

    console.log('✅ RAM purchase successful!')
    console.log('Transaction ID:', buyRamResult.transaction_id)

    // Check updated account info
    console.log('\n🔍 Checking updated account info...')
    const updatedAccountInfo = await rpc.get_account(config.account)
    console.log(`💰 New balance: ${updatedAccountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 New RAM usage: ${updatedAccountInfo.ram_usage} bytes`)

    console.log('\n🎉 RAM purchase completed!')
    console.log('Ready for contract deployment!')

    return true

  } catch (error) {
    console.error('❌ RAM purchase failed:', error.message)
    console.error('Full error:', error)
    return false
  }
}

// Run RAM purchase
buyRAM()
  .then((success) => {
    if (success) {
      console.log('\n🚀 Now ready for Docker deployment!')
    } else {
      console.log('\n💥 RAM purchase failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 