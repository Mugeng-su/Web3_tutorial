const { task } = require("hardhat/config");

task("interact-fundMe", "Interact with the FundMe contract")
    .addParam("addr","fundMe contract address")
    .setAction(async (taskArgs, hre) => {
        const fundMeFactory = await ethers.getContractFactory("FundMe")
        const fundMe = await fundMeFactory.attach(taskArgs.addr) // 通过地址获取合约实例
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
}) //到这里之后，fundMe还没有被初始化，所以需要传入fundMe的地址

module.exports = {}