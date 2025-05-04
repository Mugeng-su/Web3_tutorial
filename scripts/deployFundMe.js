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
}



main().then().catch((error) => {
    console.error(error) // 打印错误
    process.exit(0) // 设置退出码为1，表示有错误发生
}) // 执行main函数

