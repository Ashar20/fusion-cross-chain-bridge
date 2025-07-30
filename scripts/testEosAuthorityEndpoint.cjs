#!/usr/bin/env node

/**
 * 🌐 Test EOS Authority Mainnet Endpoint
 * 
 * This script tests the EOS Authority mainnet endpoint connectivity.
 */

const { JsonRpc } = require('eosjs');

class EosAuthorityTester {
    constructor() {
        this.rpcUrl = 'https://api.eosauthority.com';
    }

    async testEndpoint() {
        console.log('🌐 Testing EOS Authority Mainnet Endpoint');
        console.log('=' .repeat(60));
        console.log(`🌐 Endpoint: ${this.rpcUrl}\n`);

        const rpc = new JsonRpc(this.rpcUrl);
        const results = {
            connectivity: false,
            accountInfo: false,
            errors: []
        };

        try {
            // Test 1: Basic connectivity
            console.log('🔍 Test 1: Basic connectivity...');
            const info = await rpc.get_info();
            results.connectivity = true;
            console.log(`   ✅ Connectivity: OK`);
            console.log(`   📊 Head Block: ${info.head_block_num}`);
            console.log(`   ⏰ Head Time: ${info.head_block_time}`);
            console.log(`   🔧 Server Version: ${info.server_version_string}`);

            // Test 2: Account info (test with a known account)
            console.log('\n🔍 Test 2: Account info...');
            try {
                const accountInfo = await rpc.get_account('eosio');
                results.accountInfo = true;
                console.log(`   ✅ Account Info: OK`);
                console.log(`   📁 Account: ${accountInfo.account_name}`);
                console.log(`   📅 Created: ${accountInfo.created}`);
            } catch (error) {
                results.errors.push(`Account Info: ${error.message}`);
                console.log(`   ❌ Account Info: Failed (${error.message})`);
            }

        } catch (error) {
            results.errors.push(`Connectivity: ${error.message}`);
            console.log(`   ❌ Connectivity: Failed (${error.message})`);
        }

        this.displayResults(results);
    }

    displayResults(results) {
        console.log('\n📊 EOS Authority Mainnet Test Results');
        console.log('=' .repeat(60));

        const score = [results.connectivity, results.accountInfo].filter(Boolean).length;
        const maxScore = 2;
        const percentage = Math.round((score / maxScore) * 100);

        console.log(`🏆 Overall Score: ${score}/${maxScore} (${percentage}%)`);
        console.log(`🌐 Endpoint: ${this.rpcUrl}`);

        console.log('\n📋 Test Results:');
        console.log(`   ✅ Connectivity: ${results.connectivity ? 'OK' : 'FAIL'}`);
        console.log(`   ✅ Account Info: ${results.accountInfo ? 'OK' : 'FAIL'}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
        }

        console.log('\n🎯 Recommendation:');
        if (score >= 2) {
            console.log(`   🏆 EXCELLENT! EOS Authority endpoint works perfectly!`);
            console.log(`   📋 Ready for mainnet account creation and deployment.`);
        } else if (score >= 1) {
            console.log(`   🟡 GOOD! EOS Authority endpoint has some issues but is usable.`);
            console.log(`   📋 Can proceed with caution.`);
        } else {
            console.log(`   🔴 POOR! EOS Authority endpoint has connectivity issues.`);
            console.log(`   💡 Try a different RPC endpoint.`);
        }
    }
}

// Run the EOS Authority tester
async function main() {
    const tester = new EosAuthorityTester();
    
    try {
        await tester.testEndpoint();
    } catch (error) {
        console.error('❌ EOS Authority testing failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { EosAuthorityTester }; 