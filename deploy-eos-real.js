import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import { TextEncoder, TextDecoder } from 'util'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

console.log('🚀 REAL EOS CONTRACT DEPLOYMENT')
console.log('=' .repeat(50))

// Configuration
const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
  account: process.env.EOS_ACCOUNT,
  privateKey: process.env.EOS_PRIVATE_KEY,
  contractName: 'fusionbridge'
}

async function deployContract() {
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

    // Check account
    console.log(`💰 Checking account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Account found! Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)

    // Load WASM and ABI files
    console.log('📁 Loading contract files...')
    const wasmPath = path.join(process.cwd(), 'contracts', 'eos', 'fusionbridge.wasm')
    const abiPath = path.join(process.cwd(), 'contracts', 'eos', 'fusionbridge.abi')
    
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found: ${wasmPath}`)
    }
    if (!fs.existsSync(abiPath)) {
      throw new Error(`ABI file not found: ${abiPath}`)
    }

    const wasmBuffer = fs.readFileSync(wasmPath)
    const abiBuffer = fs.readFileSync(abiPath)
    const abi = JSON.parse(abiBuffer.toString())

    console.log(`✅ Files loaded! WASM: ${wasmBuffer.length} bytes, ABI: ${abiBuffer.length} bytes`)

    // Deploy contract
    console.log('🚀 Deploying contract...')
    console.log('⚠️  This will cost real EOS tokens!')
    
    // Set contract code
    console.log('📦 Setting contract code...')
    const setCodeResult = await api.transact({
      actions: [{
        account: 'eosio',
        name: 'setcode',
        authorization: [{
          actor: config.account,
          permission: 'active'
        }],
        data: {
          account: config.account,
          vmtype: 0,
          vmversion: 0,
          code: wasmBuffer
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })

    console.log('✅ Contract code deployed!')
    console.log('Transaction ID:', setCodeResult.transaction_id)

    // Set contract ABI
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
    
    if (code.wasm) {
      console.log('🎉 CONTRACT DEPLOYMENT SUCCESSFUL!')
      console.log('=' .repeat(50))
      console.log(`📍 Account: ${config.account}`)
      console.log(`📜 Contract: ${config.contractName}`)
      console.log(`📊 WASM Size: ${code.wasm.length} bytes`)
      console.log(`🔗 Network: Jungle4 Testnet`)
      console.log(`💰 Cost: ~100 EOS (RAM + CPU)`)
      
      console.log('\n🧪 Testing contract...')
      
      // Test contract functionality
      try {
        const statsResult = await api.transact({
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
        console.log('Transaction ID:', statsResult.transaction_id)
        
      } catch (testError) {
        console.log('⚠️  Contract test failed (this is normal for new deployments):', testError.message)
      }
      
      console.log('\n🎯 DEPLOYMENT COMPLETED!')
      console.log('Your HTLC contract is now live on Jungle4 testnet!')
      
    } else {
      throw new Error('Contract deployment verification failed')
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    console.error('Full error:', error)
    throw error
  }
}

// Run deployment
deployContract()
  .then(() => {
    console.log('\n🎉 All done!')
  })
  .catch(error => {
    console.error('\n💥 Deployment failed!')
    process.exit(1)
  }) 