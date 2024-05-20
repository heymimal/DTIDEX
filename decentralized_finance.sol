// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DecentralizedFinance is ERC20 {
    // define variables
    address public owner;
    uint256 maxLoanDuration;
    uint256 public rateEthToDex;
    uint256 ethTotalBalance;

    struct Loan {
            address payable lender; // determines the address of the lender of a loan (the lender could be this smart contract or another user).
            address payable borrower; // that determines the address of the borrower
            uint deadline; //  determines the deadline of a loan
            uint amountEth; //  determines the amount of a loan in ETH
            bool isBasedNft; // true if an NFT is used as collateral; otherwise, it is false.
            uint nftContract;
            uint nftId;
        }

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256) private dexCounters;

    event loanCreated(address indexed borrower, uint256 amount, uint256 deadline);

    constructor() ERC20("DEX", "DEX") {
        //initialize
        owner = payable(msg.sender);
        maxLoanDuration = 1 days;
        rateEthToDex = 100; // 100 ethereum to 1 dex, idk, something
        _mint(address(this), 10**30);

    }

    function buyDex() external payable {
        // TODO: implement this
        require(msg.value >= rateEthToDex, "Insufficient amount in msg"); // value in eth

        uint256 tokenAmount = msg.value/rateEthToDex;
        require(tokenAmount <= balanceOf(address(this)),"Not sufficient tokens for sale");
        _transfer(address(this), msg.sender,tokenAmount);
        ethTotalBalance += msg.value;
    }

    function sellDex(uint256 dexAmount) external {
        // TODO: implement this
        require(dexAmount > 0, "No DEX coins were provided");
        require(balanceOf(address(msg.sender)) >= dexAmount,"User does not have enough coins");
        uint256 ethToTrade = dexAmount * rateEthToDex;
        require(ethTotalBalance >= ethToTrade, "Contract does not have sufficient ETH");
        ethTotalBalance = ethTotalBalance - ethToTrade;
        _transfer(msg.sender, address(this),dexAmount);
        payable(msg.sender).transfer(ethToTrade);
    }

    function loan(uint256 dexAmount, uint256 deadline) external {
        require(dexAmount >= balanceOf(msg.sender),"Not enough DEX tokens.");
        require(deadline <= maxLoanDuration, "Loan duration should not exceed the maxLoanDuration");
        uint256 ethAmount = dexAmount*ethTotalBalance;
        require(ethAmount >= ethTotalBalance, "Not enough ETH in the contract");
        // the longer the payback deadline, the lower the value of ETH per DEX, and
        payable(msg.sender).transfer(ethAmount/2);
        _transfer(msg.sender, address(this), dexAmount);
        Loan memory l = Loan(address(this),msg.sender,deadline,ethAmount,false,0,0, true);
        loanIdCounter.increment();
        uint256 loanID = loanIdCounter.current();
        loans[loanID] = l;
        //return loanID;

        emit loanCreated(msg.sender, loanAmount, deadline);
    }

    function returnLoan(uint256 ethAmount) external {
        /*
        //check if loan exists
            require(loans[loanId].created, "Invalid Loan");
            //check if msg.sender is the borrower
            Loan memory l = loans[loanId];
            require(l.borrower == msg.sender, "You are not the borrower of this loan.");
            // ask if they need to return everything
            l.amountEth = 0;
        */
    }

    function getBalance() public view returns (uint256) {
        return ethTotalBalance;
    }

    function setDexSwapRate(uint256 rate) external {
        // TODO: implement this
    }

    function getDexBalance() public view returns (uint256) {
       return balanceOf(msg.sender);
    }

    function makeLoanRequestByNft(IERC721 nftContract, uint256 nftId, uint256 loanAmount, uint256 deadline) external {
        // TODO: implement this
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO: implement this
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO: implement this

        emit loanCreated(msg.sender, loanAmount, deadline);
    }

    function checkLoan(uint256 loanId) external {
        // TODO: implement this
    }
}
