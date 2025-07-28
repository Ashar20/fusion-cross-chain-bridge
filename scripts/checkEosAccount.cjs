const fetch = require('node-fetch');

/**
 * 🔍 Check EOS Account Status
 * Simple script to verify account exists and has funds
 */
async function checkEosAccount() {
  const accountName = 'quicksnake34';
  
  console.log('🔍 Checking EOS Account Status');
  console.log('=' .repeat(40));
  console.log(`📍 Account: ${accountName}`);
  console.log(`📍 Network: Jungle4 Testnet`);
  
  try {
    // Check account info
    console.log('\n📊 Getting account information...');
    const accountResponse = await fetch('https://jungle4.cryptolions.io/v1/chain/get_account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_name: accountName })
    });
    
    if (!accountResponse.ok) {
      throw new Error(`Account not found: ${accountResponse.status}`);
    }
    
    const account = await accountResponse.json();
    console.log('✅ Account found!');
    console.log(`   Account Name: ${account.account_name}`);
    console.log(`   Created: ${account.created}`);
    console.log(`   RAM Quota: ${account.ram_quota} bytes`);
    console.log(`   CPU Weight: ${account.cpu_weight}`);
    console.log(`   NET Weight: ${account.net_weight}`);
    
    // Check balance
    console.log('\n💰 Getting EOS balance...');
    const balanceResponse = await fetch('https://jungle4.cryptolions.io/v1/chain/get_currency_balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'eosio.token',
        account: accountName,
        symbol: 'EOS'
      })
    });
    
    if (balanceResponse.ok) {
      const balance = await balanceResponse.json();
      console.log('✅ Balance retrieved!');
      console.log(`   EOS Balance: ${balance.join(', ') || '0.0000 EOS'}`);
    } else {
      console.log('⚠️  Could not fetch balance');
    }
    
    // Check if account has contract deployed
    console.log('\n🏗️  Checking for deployed contracts...');
    const codeResponse = await fetch('https://jungle4.cryptolions.io/v1/chain/get_code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_name: accountName })
    });
    
    if (codeResponse.ok) {
      const code = await codeResponse.json();
      if (code.code_hash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('✅ Contract code found!');
        console.log(`   Code Hash: ${code.code_hash}`);
        console.log(`   ABI: ${code.abi ? 'Present' : 'Missing'}`);
      } else {
        console.log('⚠️  No contract code deployed');
        console.log('💡 Ready to deploy fusionbridge contract');
      }
    } else {
      console.log('⚠️  Could not check contract code');
    }
    
    console.log('\n🎉 Account check completed!');
    console.log('=' .repeat(40));
    console.log('✅ Account is ready for contract deployment');
    console.log('💡 Next step: Compile and deploy fusionbridge contract');
    
  } catch (error) {
    console.error('❌ Account check failed:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   1. Account does not exist');
    console.log('   2. Network connectivity issues');
    console.log('   3. Jungle4 testnet is down');
  }
}

// Run the check
checkEosAccount().catch(console.error); 