require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config() // 引入dotenv模块，用于读取.env文件中的环境变量

const SEPOLIA_URL = process.env.SEPOLIA_URL // 读取环境变量
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY // 读取环境变量

module.exports = {
  solidity: "0.8.28",
  network:{
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  }
};
