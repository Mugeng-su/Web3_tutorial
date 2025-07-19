const { ethers } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers") //引入测试网络上时间的流逝
const { deploymentChains } = require("../../helper-hardhat-config") // 引入配置文件中的deploymentChains

!deploymentChains.includes(network.name) // 如果当前为本地或hardhat网络，则跳过
? describe.skip
: describe("unit test fundme contract", async function () {
    let fundMe
    let fundMeSecondAccount
    let firstAccount
    let secondAccount
    let mockV3Aggregator
    beforeEach(async function () {
        await deployments.fixture(["all"]) // 加载 tag 为 fundme 的部署脚本
        //在每个测试用例（it()）执行之前，自动运行部署脚本中 tag 为 "FundMe" 的那部分部署逻辑，并恢复初始状态。
        firstAccount = (await getNamedAccounts()).firstAccount // 获取第一个账户
        secondAccount = (await getNamedAccounts()).secondAccount // 获取第二个账户,这里是用于下边测试notOwner的情况
        const fundMeDeployment = await deployments.get("FundMe") // 获取 FundMe 部署信息
        mockV3Aggregator = await deployments.get("MockV3Aggregator") // 获取 MockV3Aggregator 部署信息
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address) // 获取 FundMe 合约实例
        fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount)
        //这里的getContractAt是通过合约名和地址来获取合约实例
        //注意这里的getNamedAccounts()是从hardhat.config.js中获取的账户
        //getNamedAccounts()是一个异步函数，所以需要用await来获取结果

    })

    it("test if the owner is msg.sender", async function (){
        await fundMe.waitForDeployment() // 等待部署完成
        assert.equal((await fundMe.owner()), firstAccount) // 验证合约的owner是否是第一个账户
    })

    it("test if the dataFeed is assigned correctly", async function (){
        await fundMe.waitForDeployment() // 等待部署完成
        assert.equal((await fundMe.dataFeed()), mockV3Aggregator.address) // 验证合约的dataFeed是否是预期的地址
    })

    // fund, getFund, refund
    // unit test for fund 
    // window open, value greater than minimum, funder balance
    it("window closed, value greater than mininum, fund failed",
        async function () {
            await helpers.time.increase(200) // 增加时间到181秒，超过锁定时间
            await helpers.mine()
            // value is greater than minimum
            expect (fundMe.fund({value: ethers.parseEther("0.1")}))
                .to.be.revertedWith("window is closed")
        }
    )
    it("window open, value is less than minimum, fund failed",
        async function(){
            expect (fundMe.fund({value: ethers.parseEther("0.01")}))
                .to.be.revertedWith("Send more ETH")
        }
    )
    
    it("window open, value is greater than minimum, fund success",
        async function () {
            // value is greater than minimum
            await fundMe.fund({value: ethers.parseEther("0.1")}) // 投资0.1 ETH
            const balance = await fundMe.fundersToAmount(firstAccount) // 获取投资人余额
            expect(balance).to.equal(ethers.parseEther("0.1")) // 验证投资人余额是否跟投资金额一致
        }
    )

    //unit test for getFund
    //onlyOwner, windowClose, target reached
    it("not owner, window closed, target reached, getFund failed",
        async function (){

            // value is greater than minimum
            await fundMe.fund({value: ethers.parseEther("1")}) // 投资1ETH

            await helpers.time.increase(200) // 增加时间到181秒，超过锁定时间
            await helpers.mine()
            
            await expect(fundMeSecondAccount.getFund())
                .to.be.revertedWith("this function can only be called by owner")
        }
    )
    it("window open, target reached, getFund failed",
        async function(){
         // value is greater than minimum
            await fundMe.fund({value: ethers.parseEther("1")}) // 投资1ETH   
            await expect(fundMe.getFund())
                .to.be.revertedWith("window is not yet closed")           
        }
    )

    it("window closed, target not reached, getFund failed",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.1")}) // 投资0.1ETH
            await helpers.time.increase(200) // 增加时间到181秒，超过锁定时间
            await helpers.mine()
            await expect(fundMe.getFund())
                .to.be.revertedWith("Target is not reached") // 验证目标未达成
        }
    )

    it("window closed, target reached, getFund success",
        async function () {
            await fundMe.fund({value: ethers.parseEther("1")}) // 投资1ETH
            await helpers.time.increase(200) // 增加时间到200秒，超过锁定时间
            await helpers.mine()
            await expect(fundMe.getFund())
                .to.emit(fundMe, "FundWithdrawnByOwner")
                .withArgs(ethers.parseEther("1"))
        }
    )

    //refund
    // window closed, target not reached, funder has balance
    it("window open, target not reached, funder has balance",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.1")}) // 投资0.1ETH
            await expect(fundMe.refund())
                .to.be.revertedWith("window is not yet closed") // 验证窗口未关闭
        }
    )

    it("window closed, target reached, funder has balance",
        async function(){
            await fundMe.fund({value: ethers.parseEther("1")}) // 投资1ETH
            await helpers.time.increase(200) // 增加时间到181秒，超过锁定时间
            await helpers.mine()
            await expect(fundMe.refund())
                .to.be.revertedWith("Target is reached.") // 验证目标已达成
        }
    )

    it("window closed, target reached, funder has balance",
    async function(){
        await fundMe.fund({value: ethers.parseEther("0.1")}) // 投资1ETH
        await helpers.time.increase(200) // 增加时间到181秒，超过锁定时间
        await helpers.mine()
        await expect(fundMeSecondAccount.refund())
            .to.be.revertedWith("there is no fund for you") // 验证目标已达成
        }
    )

    it("window closed, target not reached, funder has balance",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.1")}) // 投资0.1ETH
            await helpers.time.increase(200) // 增加时间到181秒，超过锁定时间
            await helpers.mine()
            await expect(fundMe.refund())
                .to.emit(fundMe, "RefundByFunder")
                .withArgs(firstAccount, ethers.parseEther("0.1")) // 验证事件是否被触发
        })
    })