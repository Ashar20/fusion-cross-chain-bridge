#!/bin/bash
echo "🧪 Testing EOS HTLC Contract..."

echo "📋 Test HTLC Parameters:"
cat << EOF
{
  "sender": "quicksnake34",
  "recipient": "quicksnake34",
  "amount": "0.1000 EOS",
  "hashlock": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timelock": $(date -d '+1 hour' +%s),
  "memo": "Test HTLC",
  "eth_tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
EOF

echo "💡 Test command (after deployment):"
echo "cleos -u https://jungle4.cryptolions.io push action quicksnake34 createhtlc '{\"sender\":\"quicksnake34\",\"recipient\":\"quicksnake34\",\"amount\":\"0.1000 EOS\",\"hashlock\":\"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\",\"timelock\":$(date -d '+1 hour' +%s),\"memo\":\"Test HTLC\",\"eth_tx_hash\":\"0x0000000000000000000000000000000000000000000000000000000000000000\"}' -p quicksnake34@active"
