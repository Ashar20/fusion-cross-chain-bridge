const { execSync } = require('child_process');

/**
 * 🔍 EOS Contract Deployment Verification
 * Checks if the fusionbridge contract is deployed on Jungle4
 */
class EosDeploymentVerifier {
  constructor() {
    this.accountName = 'quicksnake34';
    this.rpcUrl = 'https://jungle4.cryptolions.io';
    
    console.log('🔍 EOS Contract Deployment Verifier');
    console.log(`📍 Account: ${this.accountName}`);
    console.log(`📍 Network: Jungle4 Testnet`);
  }
  
  /**
   * 🔍 Check contract code
   */
  checkContractCode() {
    console.log('\n🔍 Checking contract code...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_code -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const code = JSON.parse(response);
      
      if (code.code_hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('❌ No contract deployed');
        console.log('💡 Contract code hash is all zeros');
        return false;
      } else {
        console.log('✅ Contract deployed!');
        console.log(`   Code Hash: ${code.code_hash}`);
        console.log(`   Code Size: ${code.code_size} bytes`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to check contract code:', error.message);
      return false;
    }
  }
  
  /**
   * 📋 Check contract ABI
   */
  checkContractAbi() {
    console.log('\n📋 Checking contract ABI...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_abi -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const abi = JSON.parse(response);
      
      if (!abi.abi) {
        console.log('❌ No ABI found');
        return false;
      }
      
      console.log('✅ Contract ABI found!');
      console.log(`   Version: ${abi.abi.version}`);
      console.log(`   Actions: ${abi.abi.actions.length}`);
      
      // Check for required actions
      const requiredActions = ['createhtlc', 'claimhtlc', 'refundhtlc', 'gethtlc', 'getstats', 'cleanup'];
      const foundActions = abi.abi.actions.map(action => action.name);
      
      console.log('\n📋 Required Actions:');
      requiredActions.forEach(action => {
        const found = foundActions.includes(action);
        console.log(`   ${found ? '✅' : '❌'} ${action}`);
      });
      
      // Check for tables
      if (abi.abi.tables && abi.abi.tables.length > 0) {
        console.log('\n📊 Tables:');
        abi.abi.tables.forEach(table => {
          console.log(`   ✅ ${table.name} (${table.type})`);
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to check contract ABI:', error.message);
      return false;
    }
  }
  
  /**
   * 🧪 Test HTLC creation
   */
  testHtlcCreation() {
    console.log('\n🧪 Testing HTLC creation...');
    
    try {
      // This would require a signed transaction
      // For now, we'll just check if the account has the contract
      console.log('💡 HTLC creation test requires signed transaction');
      console.log('💡 Use online tools to test: https://jungle4.cryptolions.io/');
      console.log('💡 Or run: npm run real-eos');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to test HTLC creation:', error.message);
      return false;
    }
  }
  
  /**
   * 📊 Check account resources
   */
  checkAccountResources() {
    console.log('\n📊 Checking account resources...');
    
    try {
      const response = execSync(`curl -s -X POST ${this.rpcUrl}/v1/chain/get_account -H "Content-Type: application/json" -d '{"account_name":"${this.accountName}"}'`, { encoding: 'utf8' });
      const account = JSON.parse(response);
      
      console.log('✅ Account resources:');
      console.log(`   Balance: ${account.core_liquid_balance}`);
      console.log(`   RAM: ${account.ram_quota} bytes (${account.ram_usage} used)`);
      console.log(`   CPU: ${account.cpu_weight} EOS`);
      console.log(`   NET: ${account.net_weight} EOS`);
      
      return account;
    } catch (error) {
      console.error('❌ Failed to check account resources:', error.message);
      return null;
    }
  }
  
  /**
   * 🚀 Complete verification
   */
  async verify() {
    console.log('🚀 Starting EOS Contract Deployment Verification');
    console.log('=' .repeat(50));
    
    // Check account resources
    const account = this.checkAccountResources();
    if (!account) {
      return false;
    }
    
    // Check contract code
    const codeDeployed = this.checkContractCode();
    
    // Check contract ABI
    const abiDeployed = this.checkContractAbi();
    
    // Test HTLC creation
    this.testHtlcCreation();
    
    console.log('\n🎯 Verification Summary:');
    console.log('=' .repeat(50));
    console.log(`   Account Resources: ${account ? '✅' : '❌'}`);
    console.log(`   Contract Code: ${codeDeployed ? '✅' : '❌'}`);
    console.log(`   Contract ABI: ${abiDeployed ? '✅' : '❌'}`);
    
    if (codeDeployed && abiDeployed) {
      console.log('\n🎉 Contract is fully deployed and ready!');
      console.log('💡 Next steps:');
      console.log('   1. Update .env with EOS credentials');
      console.log('   2. Test real EOS integration: npm run real-eos');
      console.log('   3. Start relayer: npm run start-relayer');
      console.log('   4. Test swaps: npm run bidirectional');
      return true;
    } else {
      console.log('\n⚠️  Contract not fully deployed');
      console.log('💡 Follow the online deployment guide: ONLINE_EOS_DEPLOYMENT.md');
      return false;
    }
  }
}

// Export for use in other scripts
module.exports = { EosDeploymentVerifier };

// Run verification if called directly
if (require.main === module) {
  const verifier = new EosDeploymentVerifier();
  verifier.verify();
} 