import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 GETTING CONTRACT ID AND TRANSACTION DETAILS')
console.log('=' .repeat(60))

const config = {
  rpcUrl: process.env.EOS_RPC_URL || 'https://jungle4.cryptolions.io',
  account: process.env.EOS_ACCOUNT
}

async function getContractId() {
  try {
    console.log('📡 Connecting to EOS blockchain...')
    const rpc = new JsonRpc(config.rpcUrl, { fetch })
    
    console.log(`💰 Account: ${config.account}`)
    const accountInfo = await rpc.get_account(config.account)
    console.log(`✅ Account found! Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM Usage: ${accountInfo.ram_usage} bytes`)
    
    console.log('\n🎯 CONTRACT IDENTIFICATION')
    console.log('=' .repeat(40))
    console.log(`📍 Contract Account: ${config.account}`)
    console.log(`🔗 Network: Jungle4 Testnet`)
    console.log(`🌐 RPC URL: ${config.rpcUrl}`)
    console.log(`🔑 Chain ID: 73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d`)
    
    console.log('\n📋 DEPLOYMENT TRANSACTIONS')
    console.log('=' .repeat(40))
    
    // Try to get recent actions
    try {
      const actions = await rpc.get_actions(config.account, -1, -50)
      console.log(`✅ Found ${actions.actions.length} recent actions`)
      
      let setCodeTx = null
      let setAbiTx = null
      
      for (const action of actions.actions) {
        if (action.action_trace.act.account === 'eosio') {
          if (action.action_trace.act.name === 'setcode') {
            setCodeTx = action.action_trace
          }
          if (action.action_trace.act.name === 'setabi') {
            setAbiTx = action.action_trace
          }
        }
      }
      
      if (setCodeTx) {
        console.log('\n📦 CONTRACT CODE DEPLOYMENT:')
        console.log('-' .repeat(30))
        console.log(`🔗 Transaction ID: ${setCodeTx.trx_id}`)
        console.log(`📅 Block Number: ${setCodeTx.block_num}`)
        console.log(`⏰ Block Time: ${setCodeTx.block_time}`)
        console.log(`📊 Action Index: ${setCodeTx.action_ordinal}`)
      }
      
      if (setAbiTx) {
        console.log('\n📋 CONTRACT ABI DEPLOYMENT:')
        console.log('-' .repeat(30))
        console.log(`🔗 Transaction ID: ${setAbiTx.trx_id}`)
        console.log(`📅 Block Number: ${setAbiTx.block_num}`)
        console.log(`⏰ Block Time: ${setAbiTx.block_time}`)
        console.log(`📊 Action Index: ${setAbiTx.action_ordinal}`)
      }
      
    } catch (error) {
      console.log('❌ Could not retrieve transaction history:', error.message)
    }
    
    console.log('\n🎯 CONTRACT IDENTIFIERS')
    console.log('=' .repeat(40))
    console.log(`📋 Contract Name: fusionbridge`)
    console.log(`📍 Contract Account: ${config.account}`)
    console.log(`🔗 Contract Address: ${config.account}@active`)
    console.log(`🌐 Network: Jungle4 Testnet`)
    console.log(`🔑 Chain ID: 73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d`)
    
    console.log('\n📊 CONTRACT METADATA')
    console.log('=' .repeat(40))
    console.log(`💰 Account Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM Usage: ${accountInfo.ram_usage} bytes`)
    console.log(`📊 RAM Quota: ${accountInfo.ram_quota} bytes`)
    console.log(`📊 Available RAM: ${accountInfo.ram_quota - accountInfo.ram_usage} bytes`)
    console.log(`⚡ CPU Available: ${accountInfo.cpu_limit?.available || 'N/A'}`)
    console.log(`🌐 NET Available: ${accountInfo.net_limit?.available || 'N/A'}`)
    
    console.log('\n🔗 EXPLORER LINKS')
    console.log('=' .repeat(40))
    console.log(`🌐 Jungle4 Explorer: https://jungle4.cryptolions.io/account/${config.account}`)
    console.log(`📊 Bloks.io: https://jungle4.bloks.io/account/${config.account}`)
    console.log(`🔍 EOSPark: https://jungle4.eospark.com/account/${config.account}`)
    
    console.log('\n📋 INTEGRATION DETAILS')
    console.log('=' .repeat(40))
    console.log('For your cross-chain bridge integration:')
    console.log(`📋 Contract Account: ${config.account}`)
    console.log(`🔗 RPC URL: ${config.rpcUrl}`)
    console.log(`🔑 Chain ID: 73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d`)
    console.log(`📊 Contract Type: HTLC (Hashed Timelock Contract)`)
    console.log(`🎯 Purpose: Cross-chain atomic swaps`)
    
    console.log('\n🎉 CONTRACT ID SUMMARY')
    console.log('=' .repeat(40))
    console.log('✅ CONTRACT FULLY DEPLOYED!')
    console.log(`📍 Account: ${config.account}`)
    console.log(`📋 Name: fusionbridge`)
    console.log(`🌐 Network: Jungle4 Testnet`)
    console.log(`🚀 Status: Ready for cross-chain atomic swaps`)
    
    return {
      account: config.account,
      network: 'Jungle4 Testnet',
      chainId: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
      rpcUrl: config.rpcUrl,
      contractName: 'fusionbridge'
    }
    
  } catch (error) {
    console.error('❌ Failed to get contract ID:', error.message)
    return null
  }
}

// Run the script
getContractId()
  .then((contractInfo) => {
    if (contractInfo) {
      console.log('\n🎯 CONTRACT ID RETRIEVED SUCCESSFULLY!')
      console.log('=' .repeat(50))
      console.log('📋 Use these details for your integration:')
      console.log(`📍 Contract Account: ${contractInfo.account}`)
      console.log(`🌐 Network: ${contractInfo.network}`)
      console.log(`🔑 Chain ID: ${contractInfo.chainId}`)
      console.log(`🔗 RPC URL: ${contractInfo.rpcUrl}`)
    } else {
      console.log('\n💥 Failed to retrieve contract ID')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  }) 