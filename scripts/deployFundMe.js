// import ethers.js
// create main function 在函数中，通过ethers.js获取到这个合约，然后对合约进行部署

// execute main function

const { ethers } = require ("hardhat")

async function main(){
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

    
    //init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners(); // 获取两个账户
    //fund contract with first account
    const fundTx = await fundMe.fund({ value: ethers.parseEther("0.0005")})
    await fundTx.wait(); // 等待交易完成
    // check balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of contract: ${balanceOfContract}`) // 打印合约余额
    // fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.0005")})
    await fundTxWithSecondAccount.wait(); // 等待交易完成
    // check balance of contract
    const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of contract after second fund: ${balanceOfContractAfterSecondFund}`) // 打印合约余额
    // check mapping fundersToAmount
    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`)
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`)
}

async function verifyFundMe(fundMeAddr,args){
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: [args], // 这里的入参是FundMe合约的时间窗口
      });
}
 main().then().catch((error) => {
     console.error(error)
     process.exit(0)
 }); //java允许将函数作为变量使用，这里catch的入参是一个函数