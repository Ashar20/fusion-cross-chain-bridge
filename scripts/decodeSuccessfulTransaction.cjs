#!/usr/bin/env node

/**
 * 🔍 DECODE SUCCESSFUL TRANSACTION
 * 
 * Decodes the successful transaction to understand the exact signature format
 */

const { ethers } = require('ethers');

async function decodeSuccessfulTransaction() {
    console.log('🔍 DECODING SUCCESSFUL TRANSACTION');
    console.log('==================================\n');
    
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/5e10b8fae3204550a60ddfe976dee9b5');
    
    try {
        const tx = await provider.getTransaction('0x2fbfc4b4d043f703c259cc4c89bdad2eb4152db2de9c9fe21c133f735c4b9949');
        
        console.log('📋 TRANSACTION DETAILS:');
        console.log(`   Hash: ${tx.hash}`);
        console.log(`   From: ${tx.from}`);
        console.log(`   To: ${tx.to}`);
        console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
        console.log(`   Data Length: ${tx.data.length}`);
        console.log(`   Function Selector: ${tx.data.slice(0, 10)}`);
        
        // Remove function selector
        const data = tx.data.slice(10);
        console.log(`\n📊 PARAMETER DATA:`);
        console.log(`   Data Length: ${data.length}`);
        console.log(`   Raw Data (first 200 chars): ${data.slice(0, 200)}`);
        
        // Try to decode the parameters
        console.log(`\n🔍 DECODING PARAMETERS:`);
        
        // The signature is typically 65 bytes (130 hex chars) at the end
        const signatureStart = data.length - 130;
        const signaturePart = data.slice(signatureStart);
        console.log(`   Signature Part: ${signaturePart}`);
        console.log(`   Signature Length: ${signaturePart.length} chars`);
        
        // Check if it looks like a valid signature
        if (signaturePart.length === 130 && signaturePart.startsWith('0x')) {
            console.log(`   ✅ Looks like a valid signature format`);
        } else {
            console.log(`   ❌ Doesn't look like a valid signature format`);
        }
        
        // Let me try to decode the intent parameters
        console.log(`\n🔍 DECODING INTENT PARAMETERS:`);
        
        // The intent is typically the first parameter (after offset)
        const intentOffset = parseInt(data.slice(0, 64), 16);
        console.log(`   Intent Offset: ${intentOffset}`);
        
        // Try to decode the intent structure
        const intentData = data.slice(intentOffset * 2); // Convert to hex chars
        console.log(`   Intent Data (first 200 chars): ${intentData.slice(0, 200)}`);
        
        // Let me check if the signature is actually in the middle
        console.log(`\n🔍 CHECKING SIGNATURE LOCATION:`);
        
        // Look for signature patterns in the data
        const signaturePatterns = [];
        for (let i = 0; i < data.length - 130; i += 64) {
            const potentialSig = data.slice(i, i + 130);
            if (potentialSig.length === 130) {
                signaturePatterns.push({
                    position: i,
                    signature: potentialSig
                });
            }
        }
        
        console.log(`   Found ${signaturePatterns.length} potential signature patterns`);
        signaturePatterns.forEach((pattern, index) => {
            console.log(`   Pattern ${index + 1}: Position ${pattern.position}, Sig: ${pattern.signature.slice(0, 20)}...`);
        });
        
        // Let me try to decode using the contract ABI
        console.log(`\n🔍 TRYING ABI DECODING:`);
        
        const abi = [
            'function submitLimitOrder(tuple(address,address,address,uint256,uint256,uint256,uint256,string,bytes32,bool,uint256),bytes,bytes32,uint256) external payable returns (bytes32)'
        ];
        
        try {
            const iface = new ethers.Interface(abi);
            const decoded = iface.parseTransaction({ data: tx.data });
            console.log(`   ✅ Successfully decoded with ABI`);
            console.log(`   Function: ${decoded.name}`);
            console.log(`   Args: ${decoded.args.length} arguments`);
            
            // The second argument should be the signature
            if (decoded.args.length >= 2) {
                const signature = decoded.args[1];
                console.log(`   Signature: ${signature}`);
                console.log(`   Signature Length: ${signature.length} bytes`);
            }
            
        } catch (error) {
            console.log(`   ❌ ABI decoding failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error decoding transaction:', error.message);
    }
}

decodeSuccessfulTransaction(); 