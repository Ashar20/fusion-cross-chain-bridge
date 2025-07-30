#!/usr/bin/env node

/**
 * 🌐 Test EOS Nation Jungle4 API Endpoint
 * 
 * This script tests the EOS Nation Jungle4 endpoint to see if it resolves
 * the indexer/query issues we've been experiencing.
 */

const { JsonRpc } = require('eosjs');

class EosNationJungle4Tester {
    constructor() {
        this.accountName = 'quicksnake34';
        this.contractName = 'fusionbridge';
        this.endpoint = 'https://jungle4.api.eosnation.io';
    }

    async testEosNationEndpoint() {
        console.log('🌐 Testing EOS Nation Jungle4 API Endpoint');
        console.log('=' .repeat(60));
        console.log(`📁 Account: ${this.accountName}`);
        console.log(`📁 Contract: ${this.contractName}`);
        console.log(`🌐 Endpoint: ${this.endpoint}\n`);

        const rpc = new JsonRpc(this.endpoint);
        const results = {
            connectivity: false,
            accountInfo: false,
            wasmCode: false,
            abi: false,
            tables: false,
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

            // Test 2: Account info
            console.log('\n🔍 Test 2: Account info...');
            try {
                const accountInfo = await rpc.get_account(this.accountName);
                results.accountInfo = true;
                console.log(`   ✅ Account Info: OK`);
                console.log(`   💰 Balance: ${accountInfo.core_liquid}`);
                console.log(`   📅 Created: ${accountInfo.created}`);
            } catch (error) {
                results.errors.push(`Account Info: ${error.message}`);
                console.log(`   ❌ Account Info: Failed (${error.message})`);
            }

            // Test 3: WASM code
            console.log('\n🔍 Test 3: WASM code...');
            try {
                const code = await rpc.get_code(this.accountName);
                if (code.wasm) {
                    results.wasmCode = true;
                    console.log(`   ✅ WASM Code: OK`);
                    console.log(`   📦 Size: ${code.wasm.length} bytes`);
                    console.log(`   🔑 Code Hash: ${code.code_hash}`);
                } else {
                    console.log(`   ❌ WASM Code: No code found`);
                }
            } catch (error) {
                results.errors.push(`WASM Code: ${error.message}`);
                console.log(`   ❌ WASM Code: Failed (${error.message})`);
            }

            // Test 4: ABI
            console.log('\n🔍 Test 4: ABI...');
            try {
                const abi = await rpc.get_abi(this.accountName);
                if (abi.abi) {
                    results.abi = true;
                    console.log(`   ✅ ABI: OK`);
                    console.log(`   📋 Actions: ${abi.abi.actions?.length || 0}`);
                    console.log(`   📊 Tables: ${abi.abi.tables?.length || 0}`);
                    console.log(`   🏗️  Structs: ${abi.abi.structs?.length || 0}`);
                } else {
                    console.log(`   ❌ ABI: No ABI found`);
                }
            } catch (error) {
                results.errors.push(`ABI: ${error.message}`);
                console.log(`   ❌ ABI: Failed (${error.message})`);
            }

            // Test 5: Tables
            console.log('\n🔍 Test 5: Tables...');
            try {
                const tables = await rpc.get_table_rows({
                    json: true,
                    code: this.accountName,
                    scope: this.accountName,
                    table: 'htlcs',
                    limit: 5
                });
                results.tables = true;
                console.log(`   ✅ Tables: OK`);
                console.log(`   📊 Rows: ${tables.rows.length}`);
                console.log(`   🔢 More: ${tables.more}`);
                if (tables.rows.length > 0) {
                    console.log(`   📋 Sample row: ${JSON.stringify(tables.rows[0], null, 2)}`);
                }
            } catch (error) {
                results.errors.push(`Tables: ${error.message}`);
                console.log(`   ❌ Tables: Failed (${error.message})`);
            }

        } catch (error) {
            results.errors.push(`Connectivity: ${error.message}`);
            console.log(`   ❌ Connectivity: Failed (${error.message})`);
        }

        this.displayResults(results);
    }

    displayResults(results) {
        console.log('\n📊 EOS Nation Jungle4 Test Results');
        console.log('=' .repeat(60));

        const score = [results.connectivity, results.accountInfo, results.wasmCode, results.abi, results.tables].filter(Boolean).length;
        const maxScore = 5;
        const percentage = Math.round((score / maxScore) * 100);

        console.log(`🏆 Overall Score: ${score}/${maxScore} (${percentage}%)`);
        console.log(`🌐 Endpoint: ${this.endpoint}`);
        console.log(`📁 Account: ${this.accountName}`);
        console.log(`📁 Contract: ${this.contractName}`);

        console.log('\n📋 Test Results:');
        console.log(`   ✅ Connectivity: ${results.connectivity ? 'OK' : 'FAIL'}`);
        console.log(`   ✅ Account Info: ${results.accountInfo ? 'OK' : 'FAIL'}`);
        console.log(`   ✅ WASM Code: ${results.wasmCode ? 'OK' : 'FAIL'}`);
        console.log(`   ✅ ABI: ${results.abi ? 'OK' : 'FAIL'}`);
        console.log(`   ✅ Tables: ${results.tables ? 'OK' : 'FAIL'}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
        }

        console.log('\n🎯 Recommendation:');
        if (score >= 4) {
            console.log(`   🏆 EXCELLENT! EOS Nation endpoint works perfectly!`);
            console.log(`   📋 Switch to this endpoint for full functionality.`);
            console.log(`   🌐 Update your scripts to use: ${this.endpoint}`);
        } else if (score >= 3) {
            console.log(`   🟡 GOOD! EOS Nation endpoint has some issues but is usable.`);
            console.log(`   📋 Consider switching to this endpoint.`);
        } else {
            console.log(`   🔴 POOR! EOS Nation endpoint has the same issues as others.`);
            console.log(`   💡 This confirms it's a Jungle4 network-wide problem.`);
        }
    }
}

// Run the EOS Nation tester
async function main() {
    const tester = new EosNationJungle4Tester();
    
    try {
        await tester.testEosNationEndpoint();
    } catch (error) {
        console.error('❌ EOS Nation testing failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { EosNationJungle4Tester }; 