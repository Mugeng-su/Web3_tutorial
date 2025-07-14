require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
//require("./tasks/deploy-fundme.js");
//require("./tasks/interact-fundme.js");
require("./tasks");


const SEPOLIA_URL = process.env.SEPOLIA_URL
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const SEPOLIA_PRIVATE_KEY_1 = process.env.SEPOLIA_PRIVATE_KEY_1

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks:{
    sepolia:{
      url: SEPOLIA_URL,
      accounts: [SEPOLIA_PRIVATE_KEY, SEPOLIA_PRIVATE_KEY_1],
      chainId: 11155111 // Sepolia's chain ID
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
