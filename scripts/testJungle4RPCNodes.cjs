#!/usr/bin/env node

/**
 * 🌐 Test Different Jungle4 RPC Nodes
 * 
 * This script tests various Jungle4 RPC endpoints to find the best one
 * that supports proper contract queries and table access.
 */

const { JsonRpc } = require('eosjs');

class Jungle4RPCNodeTester {
    constructor() {
        this.accountName = 'quicksnake34';
        this.contractName = 'fusionbridge';
        
        // Different Jungle4 RPC endpoints to test
        this.rpcEndpoints = [
            {
                name: 'CryptoLions (Current)',
                url: 'https://jungle4.cryptolions.io',
                description: 'Current endpoint with query issues'
            },
            {
                name: 'Greymass',
                url: 'https://jungle4.greymass.com',
                description: 'Alternative Greymass endpoint'
            },
            {
                name: 'EOS Nation',
                url: 'https://jungle4.eosnation.io',
                description: 'EOS Nation endpoint'
            },
            {
                name: 'EOS Rio',
                url: 'https://jungle4.eosrio.io',
                description: 'EOS Rio endpoint'
            },
            {
                name: 'EOS Authority',
                url: 'https://jungle4.eosauthority.com',
                description: 'EOS Authority endpoint'
            },
            {
                name: 'EOS Canada',
                url: 'https://jungle4.eoscanada.com',
                description: 'EOS Canada endpoint'
            }
        ];
        
        this.results = [];
    }

    async testAllRPCNodes() {
        console.log('🌐 Testing Different Jungle4 RPC Nodes');
        console.log('=' .repeat(60));
        console.log(`📁 Account: ${this.accountName}`);
        console.log(`📁 Contract: ${this.contractName}`);
        console.log(`🔍 Testing ${this.rpcEndpoints.length} endpoints...\n`);

        for (const endpoint of this.rpcEndpoints) {
            await this.testRPCNode(endpoint);
        }

        this.displayResults();
    }

    async testRPCNode(endpoint) {
        console.log(`🔍 Testing ${endpoint.name}...`);
        console.log(`   🌐 URL: ${endpoint.url}`);
        
        const result = {
            name: endpoint.name,
            url: endpoint.url,
            description: endpoint.description,
            connectivity: false,
            accountInfo: false,
            wasmCode: false,
            abi: false,
            tables: false,
            error: null
        };

        try {
            // Test 1: Basic connectivity
            const rpc = new JsonRpc(endpoint.url);
            await rpc.get_info();
            result.connectivity = true;
            console.log('   ✅ Connectivity: OK');

            // Test 2: Account info
            try {
                const accountInfo = await rpc.get_account(this.accountName);
                result.accountInfo = true;
                console.log(`   ✅ Account Info: OK (Balance: ${accountInfo.core_liquid})`);
            } catch (error) {
                console.log(`   ❌ Account Info: Failed (${error.message})`);
            }

            // Test 3: WASM code
            try {
                const code = await rpc.get_code(this.accountName);
                if (code.wasm) {
                    result.wasmCode = true;
                    console.log(`   ✅ WASM Code: OK (${code.wasm.length} bytes)`);
                } else {
                    console.log('   ❌ WASM Code: No code found');
                }
            } catch (error) {
                console.log(`   ❌ WASM Code: Failed (${error.message})`);
            }

            // Test 4: ABI
            try {
                const abi = await rpc.get_abi(this.accountName);
                if (abi.abi) {
                    result.abi = true;
                    console.log(`   ✅ ABI: OK (${abi.abi.actions?.length || 0} actions)`);
                } else {
                    console.log('   ❌ ABI: No ABI found');
                }
            } catch (error) {
                console.log(`   ❌ ABI: Failed (${error.message})`);
            }

            // Test 5: Tables
            try {
                const tables = await rpc.get_table_rows({
                    json: true,
                    code: this.accountName,
                    scope: this.accountName,
                    table: 'htlcs',
                    limit: 1
                });
                result.tables = true;
                console.log(`   ✅ Tables: OK (${tables.rows.length} rows)`);
            } catch (error) {
                console.log(`   ❌ Tables: Failed (${error.message})`);
            }

        } catch (error) {
            result.error = error.message;
            console.log(`   ❌ Connectivity: Failed (${error.message})`);
        }

        this.results.push(result);
        console.log('');
    }

    displayResults() {
        console.log('📊 Jungle4 RPC Node Test Results');
        console.log('=' .repeat(60));

        // Sort by success rate
        this.results.sort((a, b) => {
            const aScore = [a.connectivity, a.accountInfo, a.wasmCode, a.abi, a.tables].filter(Boolean).length;
            const bScore = [b.connectivity, b.accountInfo, b.wasmCode, b.abi, b.tables].filter(Boolean).length;
            return bScore - aScore;
        });

        for (const result of this.results) {
            const score = [result.connectivity, result.accountInfo, result.wasmCode, result.abi, result.tables].filter(Boolean).length;
            const maxScore = 5;
            const percentage = Math.round((score / maxScore) * 100);
            
            console.log(`\n🏆 ${result.name} (${percentage}%)`);
            console.log(`   🌐 ${result.url}`);
            console.log(`   📝 ${result.description}`);
            console.log(`   📊 Score: ${score}/${maxScore}`);
            console.log(`   ✅ Connectivity: ${result.connectivity ? 'OK' : 'FAIL'}`);
            console.log(`   ✅ Account Info: ${result.accountInfo ? 'OK' : 'FAIL'}`);
            console.log(`   ✅ WASM Code: ${result.wasmCode ? 'OK' : 'FAIL'}`);
            console.log(`   ✅ ABI: ${result.abi ? 'OK' : 'FAIL'}`);
            console.log(`   ✅ Tables: ${result.tables ? 'OK' : 'FAIL'}`);
            
            if (result.error) {
                console.log(`   ❌ Error: ${result.error}`);
            }
        }

        // Find the best endpoint
        const bestEndpoint = this.results[0];
        const bestScore = [bestEndpoint.connectivity, bestEndpoint.accountInfo, bestEndpoint.wasmCode, bestEndpoint.abi, bestEndpoint.tables].filter(Boolean).length;

        console.log('\n🎯 Recommendation:');
        if (bestScore >= 4) {
            console.log(`   🏆 Best: ${bestEndpoint.name}`);
            console.log(`   🌐 URL: ${bestEndpoint.url}`);
            console.log(`   📊 Score: ${bestScore}/5`);
            console.log('\n📋 To switch to this endpoint, update your scripts with:');
            console.log(`   API_ENDPOINT="${bestEndpoint.url}"`);
        } else {
            console.log('   ⚠️  All endpoints have issues. This suggests a network-wide problem.');
            console.log('   💡 Consider using mainnet for full functionality.');
        }
    }
}

// Run the RPC node tester
async function main() {
    const tester = new Jungle4RPCNodeTester();
    
    try {
        await tester.testAllRPCNodes();
    } catch (error) {
        console.error('❌ RPC node testing failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { Jungle4RPCNodeTester }; 