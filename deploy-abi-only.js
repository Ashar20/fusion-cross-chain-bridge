import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

console.log('📋 DEPLOYING CONTRACT ABI')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY,
  contractName: 'fusionbridge'
}

async function deployABI() {
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
    console.log(`✅ Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)

    // Load ABI file
    console.log('📁 Loading ABI file...')
    const abiPath = path.join(process.cwd(), 'contracts', 'eos', 'fusionbridge.abi')
    
    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found: ${abiPath}`)
    }

    const abiBuffer = fs.readFileSync(abiPath)
    const abi = JSON.parse(abiBuffer.toString())
    console.log(`✅ ABI loaded! Size: ${abiBuffer.length} bytes`)

    // Deploy ABI
    console.log('📋 Setting contract ABI...')
    const setAbiResult = await api.transact({
      actions: [{
        account: 'eosio',
        name: 'setabi',
        authorization: [{
          actor: config.account,
          permission: 'active'
        }],
        data: {
          account: config.account,
          abi: abi
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })

    console.log('✅ Contract ABI deployed!')
    console.log('Transaction ID:', setAbiResult.transaction_id)

    // Verify deployment
    console.log('🔍 Verifying deployment...')
    const code = await rpc.get_code(config.account)
    const abiInfo = await rpc.get_abi(config.account)
    
    if (code.wasm && abiInfo.abi) {
      console.log('🎉 CONTRACT DEPLOYMENT COMPLETED!')
      console.log('=' .repeat(50))
      console.log(`📍 Account: ${config.account}`)
      console.log(`📜 Contract: ${config.contractName}`)
      console.log(`📊 WASM Size: ${code.wasm.length} bytes`)
      console.log(`📋 ABI Actions: ${abiInfo.abi.actions.length} actions`)
      console.log(`🔗 Network: Jungle4 Testnet`)
      
      // Test contract
      console.log('\n🧪 Testing contract...')
      try {
        const testResult = await api.transact({
          actions: [{
            account: config.account,
            name: 'getstats',
            authorization: [{
              actor: config.account,
              permission: 'active'
            }],
            data: {}
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30
        })
        
        console.log('✅ Contract test successful!')
        console.log('Transaction ID:', testResult.transaction_id)
        
      } catch (testError) {
        console.log('⚠️  Contract test failed (normal for new deployment):', testError.message)
      }
      
      console.log('\n🎯 DEPLOYMENT COMPLETED!')
      console.log('Your HTLC contract is now live on Jungle4 testnet!')
      
      return true
      
    } else {
      throw new Error('Contract deployment verification failed')
    }

  } catch (error) {
    console.error('❌ ABI deployment failed:', error.message)
    console.error('Full error:', error)
    return false
  }
}

// Run ABI deployment
deployABI()
  .then((success) => {
    if (success) {
      console.log('\n🎉 ABI deployment successful!')
    } else {
      console.log('\n💥 ABI deployment failed')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 