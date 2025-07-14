const { task } = require("hardhat/config")

task("deploy-fundme", "Deploy and verify the FundMe contract").setAction(async (taskArgs, hre) => {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe") // 获取合约工厂
    console.log("contract deploying")
    // deploy contract
    const fundMe = await fundMeFactory.deploy(300); //这里的deploy只是发送这个部署的操作，但是不能保证一定能够完成。入参是FuneMe合约的时间窗口
    await fundMe.waitForDeployment() // 等待部署完成（ethers v6）
    console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`);// 打印部署地址（v6用 target）
    
    //新增一个判断网络环境chainID来判断是否需要验证合约
    //通过hre来获取当前的网络环境。判断chainID是否是11155111（Sepolia的chainID），如果是，并且ETHERSCAN_API_KEY存在，则进行合约验证
    if (hre.network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY){
        // verify contract
        console.log("waiting for 5 blocks to verify the contract")
        await fundMe.deploymentTransaction().wait(5) // 等待 5 个区块确认后再验证
        await verifyFundMe(fundMe.target, 300) // 调用验证函数
    } else {
        console.log("Skipping contract verification")
    }
})

async function verifyFundMe(fundMeAddr,args){
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: [args], // 这里的入参是FundMe合约的时间窗口
      });
}

module.exports = {}