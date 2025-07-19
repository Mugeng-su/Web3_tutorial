const { deploymentChains, CONFIRMATIONS } = require("../helper-hardhat-config") // 引入配置文件中的deploymentChains
const { networkConfig } = require("../helper-hardhat-config") // 引入网络配置
const { LOCK_TIME } = require("../helper-hardhat-config") // 引入锁定时间常量

module.exports = async ({getNamedAccounts,deployments}) => {
    const firstAccount = (await getNamedAccounts()).firstAccount // 获取第一个账户 const {firstAccount} = await getNamedAccounts() // 也可以这样写
    const {deploy} = deployments // 从deployments中获取deploy函数 也可以写成const deploy = deployments.deploy
    
    let dataFeedAddr
    let confirmations
    if (deploymentChains.includes(network.name)) { // 如果是本地网络或者hardhat网络
        const mockV3Aggregator = await deployments.get("MockV3Aggregator") // 如果是hardhat网络，获取MockV3Aggregator的地址
        dataFeedAddr = mockV3Aggregator.address // 使用MockV3Aggregator的地址
        confirmations = 0
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed // 使用真实网络的地址
        confirmations = CONFIRMATIONS // 使用配置文件中的确认数
    }
    

    const fundMe = await deploy("FundMe", { // 部署合约
        from: firstAccount, // 从第一个账户部署
        args: [LOCK_TIME, dataFeedAddr], // 构造函数的参数，这里是时间窗口和数据源地址
        log: true, // 打印日志
        waitConfirmations: confirmations, // 等待5个区块确认
    })

    //remove deployments directory or add --reset flag if you redeploy contract

    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY){
        await hre.run("verify:verify", {
            address: fundMe.address,
            constructorArguments: [LOCK_TIME, dataFeedAddr], // 部署时传入的参数
        })
    } else {
        console.log("Network is not sepolia. Skipping contract verification")
    }
}

module.exports.tags = ["FundMe","all"] // 给这个部署脚本打上标签，方便在命令行中执行时使用