require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
//require("./tasks/deploy-fundme.js");
//require("./tasks/interact-fundme.js");
require("./tasks");
require("hardhat-deploy");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");


const SEPOLIA_URL = process.env.SEPOLIA_URL
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const SEPOLIA_PRIVATE_KEY_1 = process.env.SEPOLIA_PRIVATE_KEY_1
require("hardhat-gas-reporter")


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  mocha:{
    timeout: 300000, // 设置测试超时时间为300秒
  },
  networks:{
    sepolia:{
      url: SEPOLIA_URL,
      accounts: [SEPOLIA_PRIVATE_KEY, SEPOLIA_PRIVATE_KEY_1],
      chainId: 11155111 // Sepolia's chain ID
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },

  namedAccounts:{
    firstAccount: {
      default: 0, //这里的0是指第一个账户
    },
    secondAccount: {
      default: 1, //这里的1是指第二个账户
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
},
};
