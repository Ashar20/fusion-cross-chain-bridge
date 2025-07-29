import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

async function finalStatus() {
  try {
    console.log('🎯 FINAL EOS CONTRACT DEPLOYMENT STATUS')
    console.log('=' .repeat(60))
    
    const rpc = new JsonRpc('https://jungle4.cryptolions.io', { fetch })
    
    // Check account info
    console.log('💰 Account Information:')
    console.log('-' .repeat(30))
    const accountInfo = await rpc.get_account('quicksnake34')
    console.log(`📍 Account: quicksnake34`)
    console.log(`💰 Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
    console.log(`📊 RAM usage: ${accountInfo.ram_usage} bytes`)
    console.log(`📊 RAM quota: ${accountInfo.ram_quota} bytes`)
    console.log(`📊 Available RAM: ${accountInfo.ram_quota - accountInfo.ram_usage} bytes`)
    
    // Check contract code
    console.log('\n📦 Contract Code Status:')
    console.log('-' .repeat(30))
    const code = await rpc.get_code('quicksnake34')
    
    if (code.wasm) {
      console.log('✅ CONTRACT CODE: DEPLOYED')
      console.log(`📊 WASM size: ${code.wasm.length} bytes`)
      console.log(`🔗 Code hash: ${code.code_hash}`)
    } else {
      console.log('❌ CONTRACT CODE: NOT DEPLOYED')
    }
    
    // Check contract ABI
    console.log('\n📋 Contract ABI Status:')
    console.log('-' .repeat(30))
    try {
      const abi = await rpc.get_abi('quicksnake34')
      if (abi.abi) {
        console.log('✅ CONTRACT ABI: DEPLOYED')
        console.log(`📊 Actions: ${abi.abi.actions.length}`)
        console.log(`📊 Tables: ${abi.abi.tables.length}`)
        
        console.log('\n📝 Available Actions:')
        abi.abi.actions.forEach(action => {
          console.log(`  - ${action.name}`)
        })
        
        console.log('\n📊 Available Tables:')
        abi.abi.tables.forEach(table => {
          console.log(`  - ${table.name}`)
        })
      } else {
        console.log('❌ CONTRACT ABI: NOT DEPLOYED')
      }
    } catch (error) {
      console.log('❌ CONTRACT ABI: NOT DEPLOYED')
    }
    
    // Final summary
    console.log('\n🎯 DEPLOYMENT SUMMARY:')
    console.log('=' .repeat(30))
    
    const codeDeployed = code.wasm ? true : false
    let abiDeployed = false
    
    try {
      const abi = await rpc.get_abi('quicksnake34')
      abiDeployed = abi.abi ? true : false
    } catch (error) {
      abiDeployed = false
    }
    
    if (codeDeployed && abiDeployed) {
      console.log('🎉 FULLY DEPLOYED CONTRACT!')
      console.log('✅ Contract Code: DEPLOYED')
      console.log('✅ Contract ABI: DEPLOYED')
      console.log('\n🚀 Your HTLC contract is ready for cross-chain atomic swaps!')
    } else if (codeDeployed && !abiDeployed) {
      console.log('⚠️  PARTIALLY DEPLOYED CONTRACT')
      console.log('✅ Contract Code: DEPLOYED')
      console.log('❌ Contract ABI: NOT DEPLOYED')
      console.log('\n📋 To complete deployment, deploy the ABI:')
      console.log('cleos -u https://jungle4.cryptolions.io set abi quicksnake34 contracts\\eos\\fusionbridge.abi')
      console.log('\n💡 Note: The contract is functional without ABI, but ABI provides better interface.')
    } else {
      console.log('💥 CONTRACT NOT DEPLOYED')
      console.log('❌ Contract Code: NOT DEPLOYED')
      console.log('❌ Contract ABI: NOT DEPLOYED')
    }
    
    // Next steps
    console.log('\n🔗 Next Steps:')
    console.log('=' .repeat(30))
    if (codeDeployed) {
      console.log('1. ✅ Contract is deployed and functional')
      console.log('2. 🔄 Deploy ABI (optional but recommended)')
      console.log('3. 🧪 Test contract functionality')
      console.log('4. 🌉 Integrate with cross-chain bridge')
      console.log('5. 🚀 Start performing atomic swaps')
    } else {
      console.log('1. ❌ Contract deployment failed')
      console.log('2. 🔄 Retry deployment process')
      console.log('3. 📞 Check for errors and try again')
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message)
  }
}

finalStatus() 