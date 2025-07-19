const DECIMAL = 8
const INITIAL_ANSWER = 300000000000 
const deploymentChains = ["hardhat", "local"]
const LOCK_TIME = 180 // 锁定时间为180秒
const CONFIRMATIONS = 5 // 确认数为5
const networkConfig = {
  11155111: {
    ethUsdDataFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // Sepolia testnet data feed address
  },
  97: {
    ethUsdDataFeed: "0x1234567890abcdef1234567890abcdef12345678", // Example BNB Chain data feed address
  },
  // Add more networks as needed
}

module.exports = {
  DECIMAL,
  INITIAL_ANSWER,
  deploymentChains,
  networkConfig,
  LOCK_TIME,
  CONFIRMATIONS,
}