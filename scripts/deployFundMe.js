// import ethers.js  用ethers.js来部署合约
// create main function
// execute main function

const { ethers } = require("hardhat") // 从hardhat引入ethers

async function main(){
    // create factory, 负责对合约进行部署
    const fundMeFactory = await ethers.getContractFactory("FundMe") // 获取合约工厂  
    //加了await，后面的代码会等这个操作完成后再执行。然后function 前要加async，表示这个函数是异步的
    console.log("start deploying contract...") // 打印日志
    const fundMe = await fundMeFactory.deploy(10) // 部署合约
    //fundMeFactory.deploy()只保证合约被创建了，并不保证合约的构造函数执行完成了
    await fundMe.waitForDeployment() // 等待合约部署完成
    console.log(`contract has been deployed successfully, contract address is:  ${fundMe.target}`); 
    // 打印合约地址，并且使用模板字符串，美元符号后面加上大括号，表示要插入变量的值
    

    // verify fundme
    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for 5 confirmations")
        await fundMe.deploymentTransaction().wait(5) 
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log("verification skipped..")
    }

    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners()

    // fund contract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.5")})
    await fundTx.wait()

    console.log(`2 accounts are ${firstAccount.address} and ${secondAccount.address}`)

    // check balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContract}`)

    // fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.5")})
    await fundTxWithSecondAccount.wait()

    // check balance of contract
    const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContractAfterSecondFund}`)

    // check mapping 
    const firstAccountbalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
    const secondAccountbalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountbalanceInFundMe}`)
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountbalanceInFundMe}`)
    }

async function verifyFundMe(fundMeAddr, args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
    });
    }


main().then().catch((error) => {
    console.error(error) // 打印错误
    process.exit(0) // 设置退出码为1，表示有错误发生
}) // 执行main函数

