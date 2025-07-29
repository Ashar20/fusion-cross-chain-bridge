import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

async function checkStatusAlternative() {
  try {
    console.log('🔍 CHECKING DEPLOYMENT STATUS (Alternative RPC)')
    console.log('=' .repeat(60))
    
    // Try different RPC endpoints
    const rpcEndpoints = [
      'https://jungle4.cryptolions.io',
      'https://jungle4.eossweden.org',
      'https://jungle4.greymass.com'
    ]
    
    for (const endpoint of rpcEndpoints) {
      try {
        console.log(`\n📡 Trying RPC endpoint: ${endpoint}`)
        const rpc = new JsonRpc(endpoint, { fetch })
        
        // Check account info
        const accountInfo = await rpc.get_account('quicksnake34')
        console.log(`✅ Account found! Balance: ${accountInfo.core_liquid_balance || '0.0000 EOS'}`)
        console.log(`📊 RAM usage: ${accountInfo.ram_usage} bytes`)
        console.log(`📊 RAM quota: ${accountInfo.ram_quota} bytes`)
        
        // Check contract code
        try {
          const code = await rpc.get_code('quicksnake34')
          if (code.wasm) {
            console.log(`✅ Contract code deployed! Size: ${code.wasm.length} bytes`)
          } else {
            console.log('❌ No contract code found')
          }
        } catch (codeError) {
          console.log('❌ Contract code check failed:', codeError.message)
        }
        
        // Check contract ABI
        try {
          const abi = await rpc.get_abi('quicksnake34')
          if (abi.abi) {
            console.log(`✅ Contract ABI deployed! Actions: ${abi.abi.actions.length}`)
            console.log('📝 Available actions:')
            abi.abi.actions.forEach(action => {
              console.log(`  - ${action.name}`)
            })
          } else {
            console.log('❌ No ABI found')
          }
        } catch (abiError) {
          console.log('❌ ABI check failed:', abiError.message)
        }
        
        console.log(`\n🎯 Status from ${endpoint}:`)
        console.log('=' .repeat(30))
        
        try {
          const code = await rpc.get_code('quicksnake34')
          const abi = await rpc.get_abi('quicksnake34')
          
          if (code.wasm && abi.abi) {
            console.log('🎉 FULLY DEPLOYED CONTRACT!')
            console.log('✅ Contract Code: DEPLOYED')
            console.log('✅ Contract ABI: DEPLOYED')
            return true
          } else if (code.wasm && !abi.abi) {
            console.log('⚠️  PARTIALLY DEPLOYED CONTRACT')
            console.log('✅ Contract Code: DEPLOYED')
            console.log('❌ Contract ABI: NOT DEPLOYED')
          } else {
            console.log('💥 CONTRACT NOT DEPLOYED')
            console.log('❌ Contract Code: NOT DEPLOYED')
            console.log('❌ Contract ABI: NOT DEPLOYED')
          }
        } catch (error) {
          console.log('❌ Status check failed')
        }
        
      } catch (endpointError) {
        console.log(`❌ Endpoint ${endpoint} failed:`, endpointError.message)
      }
    }
    
    console.log('\n📊 SUMMARY:')
    console.log('=' .repeat(30))
    console.log('The contract deployment status has been checked across multiple RPC endpoints.')
    console.log('If the contract code is deployed, your HTLC contract is functional.')
    console.log('The ABI deployment can be completed later if needed.')
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message)
  }
}

checkStatusAlternative() 