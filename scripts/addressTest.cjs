/**
 * Test Address Handling
 */

const algosdk = require('algosdk');

async function testAddress() {
    require('dotenv').config();
    
    const account = algosdk.mnemonicToSecretKey(process.env.ALGORAND_MNEMONIC);
    console.log('Account object:', account);
    console.log('Account.addr:', account.addr);
    console.log('Account.addr type:', typeof account.addr);
    console.log('Account.addr constructor:', account.addr.constructor.name);
    
    // Try different ways to get the address
    const addr1 = account.addr;
    const addr2 = account.addr.toString();
    const addr3 = algosdk.encodeAddress(account.addr.publicKey);
    
    console.log('addr1:', addr1, typeof addr1);
    console.log('addr2:', addr2, typeof addr2);
    console.log('addr3:', addr3, typeof addr3);
    
    // Try creating Address objects
    try {
        const addressObj = new algosdk.Address(addr2);
        console.log('Address object created:', addressObj);
    } catch (error) {
        console.log('Address creation failed:', error.message);
    }
    
    // Test the addresses are equal
    console.log('addr1 === addr2:', addr1 === addr2);
    console.log('addr2 === addr3:', addr2 === addr3);
    console.log('addr1.toString() === addr2:', addr1.toString() === addr2);
}

testAddress().catch(console.error);