const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

/**
 * 🧪 EOS Testnet Testing Script
 * Tests different EOS testnets to find the most reliable one
 */
class EosTestnetTester {
  constructor() {
    this.testnets = [
      {
        name: 'Jungle4',
        url: 'https://jungle4.cryptolions.io',
        description: 'Latest Jungle testnet'
      },
      {
        name: 'Jungle3',
        url: 'https://jungle3.cryptolions.io',
        description: 'Previous Jungle testnet'
      },
      {
        name: 'Kylin',
        url: 'https://kylin.eoscanada.com',
        description: 'Kylin testnet'
      },
      {
        name: 'Worbli',
        url: 'https://worbli.eoscanada.com',
        description: 'Worbli testnet'
      },
      {
        name: 'BOS',
        url: 'https://api.bossweden.org',
        description: 'BOS testnet'
      }
    ];
    
    this.account = 'quicksnake34';
  }

  async testTestnet(testnet) {
    console.log(`\n🔍 Testing ${testnet.name} (${testnet.description})`);
    console.log(`🌐 URL: ${testnet.url}`);
    
    try {
      const rpc = new JsonRpc(testnet.url);
      
      // Test 1: Basic connectivity
      console.log(`   📡 Testing connectivity...`);
      const info = await rpc.get_info();
      console.log(`   ✅ Connected! Chain ID: ${info.chain_id.substring(0, 8)}...`);
      
      // Test 2: Account existence
      console.log(`   👤 Testing account existence...`);
      try {
        const account = await rpc.get_account(this.account);
        console.log(`   ✅ Account exists! Balance: ${account.core_liquid_balance || 'N/A'}`);
        return { success: true, account: account };
      } catch (error) {
        console.log(`   ❌ Account not found: ${error.message}`);
        return { success: false, error: error.message };
      }
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testAllTestnets() {
    console.log(`🧪 EOS Testnet Reliability Test`);
    console.log(`============================================================`);
    console.log(`📁 Account: ${this.account}`);
    console.log(`🔍 Testing ${this.testnets.length} testnets...`);
    
    const results = [];
    
    for (const testnet of this.testnets) {
      const result = await this.testTestnet(testnet);
      results.push({
        testnet: testnet.name,
        url: testnet.url,
        success: result.success,
        error: result.error,
        account: result.account
      });
    }
    
    // Summary
    console.log(`\n📊 Test Results Summary:`);
    console.log(`============================================================`);
    
    const workingTestnets = results.filter(r => r.success);
    const failedTestnets = results.filter(r => !r.success);
    
    console.log(`✅ Working testnets: ${workingTestnets.length}`);
    workingTestnets.forEach(testnet => {
      console.log(`   - ${testnet.testnet}: ${testnet.url}`);
    });
    
    console.log(`\n❌ Failed testnets: ${failedTestnets.length}`);
    failedTestnets.forEach(testnet => {
      console.log(`   - ${testnet.testnet}: ${testnet.error}`);
    });
    
    // Recommendation
    if (workingTestnets.length > 0) {
      const bestTestnet = workingTestnets[0];
      console.log(`\n🎯 Recommendation:`);
      console.log(`   Use: ${bestTestnet.testnet}`);
      console.log(`   URL: ${bestTestnet.url}`);
      console.log(`   Account: ${bestTestnet.account ? 'Found' : 'Not found'}`);
    } else {
      console.log(`\n⚠️  No working testnets found!`);
    }
    
    return results;
  }
}

if (require.main === module) {
  const tester = new EosTestnetTester();
  tester.testAllTestnets().catch(console.error);
}

module.exports = { EosTestnetTester }; 