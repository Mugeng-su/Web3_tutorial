//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
//通过chainlink上的实例复制的预言机引用


//1. 创建一个收款函数
//2. 记录投资人并且查看
//3. 在锁定期内，达到目标值，生产商可以提款
//4. 在锁定期内，没有达到目标值，投资人可以退款

contract FundMe {
    mapping (address => uint256) public fundersToAmount;//创建一个映射，地址对应投资数值，记录投资人信息

    uint256 constant MINIMUM_VALUE = 100 * 10 ** 18; //USD

    AggregatorV3Interface public dataFeed; //合约作为类型
    //光有这个变量（合约的接口）还不行，还需要知道这个合约的地址，来初始化这个变量。
    //我们希望能够在部署完合约之后就能直接使用dataFeed，所以需要引入构造函数。
    //构造函数是部署合约时自动执行的初始化函数，只运行一次。

    uint256 constant TARGET = 1000 * 10 ** 18;

    address public owner;

    uint256 deploymentTimestamp; //众筹开始时间点  
    //为什么这里用uint256这种数字的类型来表示时间？因为在solidity中是没有类似py或者java有date这种数据类型。
    //unix时间戳 unixtimestamp.com 从1970年1月1号开始到目前的时间点总共经过了多少秒
    uint256 lockTime; //时间窗口，这个单位就是秒，设置=60就是60秒。这个就是用户（众筹发起人）来输入这个锁定期
    //这两个变量都放在构造函数里

    address erc20Addr; //声明这个变量是为了后边setErc20Addr函数用于设定erc20的地址

    bool public getFundSuccess; //这个变量是为了记录getFund函数是否被成功执行。 布尔型变量默认都是false

    event FundWithdrawnByOwner(uint256); //定义一个事件，用于记录owner提取资金的操作，参数是提取的金额
    event RefundByFunder(address, uint256); //定义一个事件，用于记录投资人退款的操作，参数是投资人的地址和退款金额

    constructor(uint256 _lockTime, address dataFeedAddr){
        //sepolia testnet
        dataFeed =  AggregatorV3Interface(dataFeedAddr);
        owner = msg.sender; //这里就是规定owner是合约的sender。修改合约的ownership见下边的新函数：transferOwnership()
    
    //其中的一个入参就需要是这个dataFeed的地址，但是由于我们使用了第三方服务，所以需要到对应的测试网上进行compile和deploy等测试操作
    //由于我们已经能够直接获得这个地址，所以直接写在函数体中，没有使用让用户入参。

        deploymentTimestamp = block.timestamp;
        //这个block表示当前的区块，.timestamp就是合约部署是的时间戳
        lockTime = _lockTime;
        //这个是入参，所以需要再构造函数里也设置好这个入参。
    }

    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more ETH");
        require((block.timestamp) < deploymentTimestamp + lockTime, "window is closed");
        //这里需要限制在fund的时候这个时间戳的时间是小于合约部署的时间戳加上时间窗口的时间，否则返回fund窗口已关闭。
        //这里的block.timestamp是调用fund函数是的时间戳
        fundersToAmount[msg.sender] = msg.value; //记录投资人和投资数额
    }

     function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
        //这里拿到了USD对ETH的价格，然后下一步是需要运算。
    }

    function convertEthToUsd(uint256 ethAmount) internal view returns (uint256){
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        //数字类型的强制转换，否则会报错
        return ethAmount * ethPrice / (10 ** 8);
        //注意这里的ethAmount的精度是10的18次方，ethPrice的精度是10的8次方
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner; //newOwner是入参，也就是调用这个函数，输如newOwner的地址即可转换ownership。
    }
    //下边是后两个功能
    function getFund() external windowClosed onlyOwner {
        //获取到本合约的余额并为美刀
        require(convertEthToUsd(address(this).balance) >= TARGET, "Target is not reached");
        //要求合约余额需大于目标值，否则返回没达标
        bool success;
        uint256 balance = address(this).balance; //获取合约的余额
        (success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true; // flag:当一个变量用于标注某种状态的时候，就称之为flag。
        // emit event
        emit FundWithdrawnByOwner(balance);
    }

    function refund() external windowClosed {
        require(convertEthToUsd(address(this).balance) < TARGET, "Target is reached.");//这个函数是给投资方退款的。
        //接下来是写退款
        //先检测这个人有没有fund过，通过查收目前这个地址有没有在mapping里
        uint256 amount = fundersToAmount[msg.sender];
        require(amount != 0, "there is no fund for you"); //如果发现该地址的fund amount等于0，则返回there is no fund.
        require((block.timestamp) >= deploymentTimestamp + lockTime, "window is not yet closed");
        
        bool success;
        uint256 balance = fundersToAmount[msg.sender]; //获取投资人地址的余额
        (success, ) = payable(msg.sender).call{value: balance}("");//通过了两个require后就可以退款了。
        require(success, "transfer tx failed");
        fundersToAmount[msg.sender] = 0;
        emit RefundByFunder(msg.sender, balance);
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner { //这里就是调用了onlyOwner这个modifier
        erc20Addr = _erc20Addr; // 让传入的erc20的地址能够进行使用
    }


    function setFunderToAmount(address funder, uint256 amountToUpdate) external {//这个函数两个入参，一个是funder的地址，一个是要更新的数量
        require(msg.sender == erc20Addr, "You do not have permission to call this function");
        //这里需要限定只能是erc20合约来调用该函数，所以需要一个函数来声明erc20的地址。
        fundersToAmount[funder] = amountToUpdate;
        //传入两个入参，修改fundersToAmount的数量
    }


    modifier windowClosed(){
        require((block.timestamp) >= deploymentTimestamp + lockTime, "window is not yet closed");
        //这里需要限制在fund的时候这个时间戳的时间是不小于合约部署的时间戳加上时间窗口的时间，否则返回fund窗口未关闭。
        _;
        //先执行判断，再执行函数中的其他操作。
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "this function can only be called by owner"); 
        //限定该函数只能由owner调用
        _;
    }
}