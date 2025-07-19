const { DECIMAL, INITIAL_ANSWER } = require("../helper-hardhat-config") // 引入常量
const { deploymentChains } = require("../helper-hardhat-config") // 引入配置文件中的deploymentChains

module.exports = async ({getNamedAccounts,deployments}) => {
    if (deploymentChains.includes(network.name)) {
        const firstAccount = (await getNamedAccounts()).firstAccount // 获取第一个账户 const {firstAccount} = await getNamedAccounts() // 也可以这样写
        const {deploy} = deployments // 从deployments中获取deploy函数 也可以写成const deploy = deployments.deploy
        await deploy("MockV3Aggregator", { // 部署合约
            from: firstAccount, // 从第一个账户部署
            args: [DECIMAL, INITIAL_ANSWER], // 构造函数的参数，这里是时间窗口
            log: true, // 打印日志
    })
    } else{
        console.log("Network is not a local or hardhat network. Skipping mock deployment.")
    }

    
}

module.exports.tags = ["all", "mock"] // 给这个部署脚本打上标签，方便在命令行中执行时使用