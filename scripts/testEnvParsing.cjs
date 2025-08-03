const fs = require('fs');

// Test env parsing
const envContent = fs.readFileSync('.env.relayer', 'utf8');
console.log('📋 Raw .env.relayer content:');
console.log(envContent);

const lines = envContent.split('\n');
console.log('\n📝 Parsed lines:');
lines.forEach((line, i) => {
    if (line.includes('=') && !line.startsWith('#') && line.trim() !== '') {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        console.log(`${i+1}: ${key.trim()} = ${value.trim()}`);
    }
});