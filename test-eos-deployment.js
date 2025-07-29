// Simple EOS Contract Deployment Test
// Tests the deployed HTLC contract on Jungle4 testnet

import { Api, JsonRpc } from 'eosjs';
import fetch from 'node-fetch';

const rpc = new JsonRpc('https://jungle4.cryptolions.io');
const accountName = 'quicksnake34';

async function testEOSDeployment() {
    console.log('Testing EOS HTLC Contract Deployment');
    console.log('Account:', accountName);
    console.log('Network: Jungle4 Testnet');
    console.log('==================================================');

    try {
        // Check account info
        console.log('\nChecking account info...');
        const accountInfo = await rpc.get_account(accountName);
        console.log('Account found!');
        console.log('   Balance:', accountInfo.core_liquid);
        console.log('   RAM:', accountInfo.ram_quota, 'bytes');
        console.log('   CPU:', accountInfo.cpu_weight);
        console.log('   NET:', accountInfo.net_weight);

        // Check contract code
        console.log('\nChecking contract code...');
        const code = await rpc.get_code(accountName);
        if (code.wasm) {
            console.log('Contract code found!');
            console.log('   WASM size:', code.wasm.length, 'bytes');
            console.log('   ABI actions:', code.abi.actions.length);
        } else {
            console.log('No contract code found');
            console.log('Please deploy the contract first');
            return;
        }

        // Test HTLC creation
        console.log('\nTesting HTLC creation...');
        console.log('Note: This test requires account to have enough EOS');
        
        const testAction = {
            account: accountName,
            name: 'createhtlc',
            authorization: [{
                actor: accountName,
                permission: 'active'
            }],
            data: {
                sender: accountName,
                recipient: accountName,
                amount: '0.1000 EOS',
                hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                timelock: 1753746959,
                memo: 'Test HTLC',
                eth_tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
            }
        };

        console.log('Test action prepared (not executed)');
        console.log('   Action:', testAction.name);
        console.log('   Amount:', testAction.data.amount);
        console.log('   Sender/Recipient:', testAction.data.sender);

        console.log('\nDeployment test completed!');
        console.log('View contract at: https://jungle4.cryptolions.io/account/' + accountName);

    } catch (error) {
        console.log('Error:', error.message);
        if (error.message.includes('Account not found')) {
            console.log('Account does not exist or is not accessible');
        } else if (error.message.includes('No contract code')) {
            console.log('Contract not deployed yet');
        }
    }
}

// Run the test
testEOSDeployment().catch(console.error); 