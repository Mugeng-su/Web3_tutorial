const { ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { deploymentChains } = require("../../helper-hardhat-config") // 引入配置文件中的deploymentChains


const isDevChain = deploymentChains.includes(network.name)


console.log("⚡ Running staging test on:", network.name)
console.log("⚡ Will skip:", deploymentChains.includes(network.name))

const describeOrSkip = isDevChain ? describe.skip : describe

describeOrSkip("staging test fundme contract", async function () {
    let fundMe
    let firstAccount

    beforeEach(async function () {
        await deployments.fixture(["all"]) // 加载 tag 为 fundme 的部署脚本
        //在每个测试用例（it()）执行之前，自动运行部署脚本中 tag 为 "FundMe" 的那部分部署逻辑，并恢复初始状态。
        firstAccount = (await getNamedAccounts()).firstAccount // 获取第一个账户
        const fundMeDeployment = await deployments.get("FundMe") // 获取 FundMe 部署信息
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address) // 获取 FundMe 合约实例
        //这里的getContractAt是通过合约名和地址来获取合约实例
        //注意这里的getNamedAccounts()是从hardhat.config.js中获取的账户
        //getNamedAccounts()是一个异步函数，所以需要用await来获取结果
    })

    // test fund and getFund successfully
    it("fund and getFund successfully",
        async function (){
            //make sure target reached
            await fundMe.fund({value: ethers.parseEther("0.5")}) // 投资0.5 ETH
            //make sure window is closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000)) // 等待181秒钟
            // make sure we can get receipt
            const getFundTx = await fundMe.getFund() // 调用getFund函数
            const getFundReceipt = await getFundTx.wait() // 等待交易被打包
            await expect(getFundReceipt)
                .to.be.emit(fundMe, "FundWithdrawnByOwner") // 验证事件是否被触发
                .withArgs(ethers.parseEther("0.5")) // 验证事件参数是否正确
        }
    )
    // test fund and refund successfully
    it ("fund and refund successfully",
        async function (){
            //make sure target not reached
            await fundMe.fund({value: ethers.parseEther("0.1")}) // 投资0.1 ETH
            //make sure window is closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000)) // 等待181秒钟
            // make sure we can get receipt
            const refundTx = await fundMe.refund() // 调用refund函数
            const refundReceipt = await refundTx.wait() // 等待交易被打包
            await expect(refundReceipt)
                .to.be.emit(fundMe, "RefundByFunder") // 验证事件是否被触发
                .withArgs(firstAccount, ethers.parseEther("0.1")) // 验证事件参数是否正确
        }
    )

    })
