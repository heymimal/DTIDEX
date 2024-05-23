// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "contracts/nft.sol";

contract DecentralizedFinance is ERC20 {
    
    using Counters for Counters.Counter;
    Counters.Counter public loanIdCounter;
    // define variables
    address public owner;
    uint256 maxLoanDuration;
    uint256 public dexSwapRate; //swap rate of one DEX in Wei - how many Wei a DEX costs
    uint256 balance; // ether balance

    struct Loan {
            address lender; // determines the address of the lender of a loan (the lender could be this smart contract or another user).
            address borrower; // that determines the address of the borrower
            uint256 deadline; //  determines the deadline of a loan
            uint256 amount; //  determines the amount of a loan in ETH
            bool isBasedNft; // true if an NFT is used as collateral; otherwise, it is false.
            address nftContract;
            uint256 nftId;
        }

    mapping(uint256 => Loan) public loans;


    event loanCreated(address indexed borrower, uint256 amount, uint256 deadline);

    constructor() ERC20("DEX", "DEX") {
        //initialize
        owner = payable(msg.sender);
        maxLoanDuration = 1 days;
        dexSwapRate = 100 wei;
        _mint(address(this), 10**30);

    }

    function buyDex() external payable {
        // TODO: implement this
        require(msg.value >= dexSwapRate, "Insufficient amount in msg"); // value in eth

        uint256 tokenAmount = msg.value/dexSwapRate;
        require(tokenAmount <= balanceOf(address(this)),"Not sufficient tokens for sale");
        _transfer(address(this), msg.sender,tokenAmount);
        balance += msg.value;
    }

    function sellDex(uint256 dexAmount) external {
        // TODO: implement this
        require(dexAmount > 0, "No DEX coins were provided");
        require(balanceOf(address(msg.sender)) >= dexAmount,"User does not have enough coins");
        uint256 ethToTrade = dexAmount * dexSwapRate;
        require(balance >= ethToTrade, "Contract does not have sufficient ETH");
        balance = balance - ethToTrade;
        _transfer(msg.sender, address(this),dexAmount);
        payable(msg.sender).transfer(ethToTrade);
    }

    function loan(uint256 dexAmount, uint256 deadline) external returns (uint256) {
        require(balanceOf(msg.sender) >= dexAmount,"User does not have enough DEX tokens.");
        require(deadline <= maxLoanDuration, "Loan duration should not exceed the maximum loan duration");
        uint256 ethAmount = dexAmount*dexSwapRate;
        require(ethAmount <= balance, "Not enough ETH in the contract");
        // the longer the payback deadline, the lower the value of ETH per DEX, and
        
        
        payable(msg.sender).transfer(ethAmount/2); //transfer half of the value
        balance = balance - ethAmount/2;
        _transfer(msg.sender, address(this), dexAmount); //send all dex coins 
        Loan memory l = Loan(address(this),msg.sender,deadline,ethAmount,false,address(0),0); // create a loan
        loanIdCounter.increment();
        uint256 loanID = loanIdCounter.current();
        loans[loanID] = l;

        emit loanCreated(msg.sender, ethAmount, deadline);
        return loanID;
    }

    function returnLoan(uint256 loanId, uint256 weiAmount) external payable {
        //weiAmount will replace msg.value
        require(loans[loanId].borrower == msg.sender, "Id not valid or Loan's borrower does not match");
        Loan memory thisLoan = loans[loanId];
        uint256 remaining = 0;
        uint256 debt = thisLoan.amount;
        if(thisLoan.isBasedNft){ // if nft, has to fully return
            require(debt <= msg.value,"For a NFT based loan, all value must be repaid");
            delete loans[loanId];
        } else {
            if (debt >= msg.value){
                loans[loanId].amount = loans[loanId].amount  - msg.value;
            } else {
                remaining = debt - msg.value;
                delete loans[loanId];
            }
        }
        balance = balance +msg.value;
        uint256 dex = msg.value/dexSwapRate;
        _transfer(address(this), msg.sender,dex);
        /*
        returnLoan(unit256 loanId, uint256 weiAmount): this function allows a user to pay
back his borrowed ETH, recovering a proportional amount of DEX. Notice that users
can make partial repayments on their loans that are not NFT-based. This could benefit
the users who can repay only part of the loan amount by the deadline.
        */
    }

    function getBalance() public view returns (uint256) {
        require (msg.sender == owner, "You are not the owner");
        return balance;
    }

    function setDexSwapRate(uint256 rate) external {
        require (msg.sender == owner, "You are not the owner");
        dexSwapRate = rate;
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

    /*function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO: implement this

        uint256 loanAmount = 0;
        uint256 deadline = maxLoanDuration;
        emit loanCreated(msg.sender, loanAmount, deadline);
    }

    function checkLoan(uint256 loanId) external {
        // TODO: implement this
    }*/
}
