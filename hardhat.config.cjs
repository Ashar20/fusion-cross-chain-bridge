require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    // Sepolia testnet with your premium Infura endpoint
    sepolia: {
      url: "https://sepolia.infura.io/v3/116078ce3b154dd0b21e372e9626f104",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
      gas: "auto"
    },
    // Ethereum mainnet with your Infura endpoint (for production)
    mainnet: {
      url: "https://mainnet.infura.io/v3/116078ce3b154dd0b21e372e9626f104", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto",
      gas: "auto"
    },
    // Local hardhat network for testing
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  gasReporter: {
    enabled: true,
    currency: "USD"
  },
  paths: {
    sources: "./contracts",
    tests: "./test", 
    cache: "./cache",
    artifacts: "./artifacts"
  }
};