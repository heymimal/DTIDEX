// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "nft.sol";
import "hardhat/console.sol";

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
        maxLoanDuration = 10; // in days
        dexSwapRate = 100 wei;
        _mint(address(this), 10**30);

    }

    function buyDex() external payable { // buy DEX tokens
        // check values for DEX exchange and contract ether balance
        require(msg.value >= dexSwapRate, "Insufficient amount in msg"); // value in eth
        uint256 tokenAmount = msg.value/dexSwapRate;
        require(tokenAmount <= balanceOf(address(this)),"Not sufficient tokens for sale");
        
        //Trasnfer DEX and ETH
        _transfer(address(this), msg.sender,tokenAmount);
        balance += msg.value;
    }

    function sellDex(uint256 dexAmount) external { // sell his/her DEX tokens
        // check values for DEX exchange and contract ether balance
        require(dexAmount > 0, "No DEX coins were provided");
        require(balanceOf(address(msg.sender)) >= dexAmount,"User does not have enough coins");
        uint256 ethToTrade = dexAmount * dexSwapRate;
        require(balance >= ethToTrade, "Contract does not have sufficient ETH");
        
        //transfer DEX and Eth
        balance = balance - ethToTrade;
        _transfer(msg.sender, address(this),dexAmount);
        payable(msg.sender).transfer(ethToTrade);
    }

    function loan(uint256 dexAmount, uint256 deadline) external returns(uint256) { //ask for a loan
        //pre-conditions
        require(balanceOf(msg.sender) >= dexAmount,"User does not have enough DEX tokens.");
        require(deadline <= maxLoanDuration, "Loan duration should not exceed the maximum loan duration");
        
        uint256 ethAmount = dexAmount*dexSwapRate;
        require(ethAmount <= balance, "Not enough ETH in the contract");
        // the longer the payback deadline, the lower the value of ETH per DEX, and
        // Add transfer method different - ler enunciado 
        uint256 deadlineInSeconds = deadline * 86400;
        uint256 dl = block.timestamp + deadlineInSeconds;

        //transfer DEX and Eth
        payable(msg.sender).transfer(ethAmount/2); //transfer half of the value
        balance = balance - ethAmount/2;
        _transfer(msg.sender, address(this), dexAmount); //send all dex coins 

        //create new loan
        Loan memory l = Loan(address(this),msg.sender,dl,ethAmount,false,address(0),0); // create a loan
        loanIdCounter.increment();
        uint256 loanID = loanIdCounter.current();
        loans[loanID] = l;

        //emit event
        emit loanCreated(msg.sender, ethAmount, dl);
        return loanID;
    }

    function returnLoan(uint256 loanId) external payable {//maybe add check to deadline?
        require(loans[loanId].borrower == msg.sender, "Id not valid or Loan's borrower does not match");
        
        uint256 remaining = 0; // might remove
        uint256 debt = loans[loanId].amount; // money to return

        if(loans[loanId].isBasedNft){ // if nft has to fully return
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
        
        uint256 dex = msg.value/dexSwapRate;

        //transfer DEX and Eth
        _transfer(address(this), msg.sender,dex);
        payable(address(this)).transfer(msg.value);
        balance = balance + msg.value;
    }

    function getBalance() public view returns (uint256) {
       // require (msg.sender == owner, "You are not the owner");
       // "when called by the contract owner" but users are supposed to be able 
       // see the total amount of ETH the contract has
        return balance;
    }

    function setDexSwapRate(uint256 rate) external {
        require (msg.sender == owner, "You are not the owner");
        dexSwapRate = rate;
    }

    function getDexSwapRate() public view returns (uint256) { //see the exchange rate
        return dexSwapRate;
    }

    function getDexBalance() public view returns (uint256) {
       return balanceOf(msg.sender);
    }

    function makeLoanRequestByNft(IERC721 nftContract, uint256 nftId, uint256 loanAmount, uint256 deadline) external returns(uint256){
        // check if sender owns the nft
        require(nftContract.ownerOf(nftId) == msg.sender, "You do not own this NFT");

        //assuming maxDeadline is only related to the direct contracts
        //create loan
        Loan memory newLoan = Loan(address(0),msg.sender,deadline,loanAmount,true,address(nftContract),nftId);
        loanIdCounter.increment();
        uint256 loanID = loanIdCounter.current();
        loans[loanID] = newLoan;
        emit loanCreated(newLoan.borrower, loanAmount, deadline);
        return loanID;
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId) external {
        for (uint256 i; i < loanIdCounter.current(); i++){
            if(loans[i].isBasedNft && loans[i].nftContract == address(nftContract) 
            && loans[i].nftId == nftId && loans[i].borrower == msg.sender){
                delete loans[i];
             }
        }
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO: implement this
        // NFT contract creation
        for (uint256 i = 0;i < loanIdCounter.current() ; i++) 
        { 
            if(loans[i].isBasedNft == true && loans[i].nftId == nftId 
                && loans[i].nftContract == address(nftContract)) { // search for the nft given

                require(msg.sender != loans[i].borrower, "This is a loan requested by you."); // "another user B"
                
                //pre-conditions
                uint256 loanAmount = loans[i].amount;
                uint256 dex = loanAmount/dexSwapRate;
                require(balanceOf(msg.sender) >= dex, "You do not have enough DEX coins for this transaction.");
                require(balance > loanAmount, "Contract does not have enough Ether");
                
                loans[i].lender = msg.sender;

                //activate loan duration here?
                uint256 deadlineInSeconds = loans[i].deadline * 86400;
                uint256 dl = block.timestamp + deadlineInSeconds;
                loans[i].deadline = dl; // deadline activated

                 //transfer DEX and Eth
                _transfer(address(msg.sender), address(this), dex); //lender pays dex to contract ("locks")
                payable(loans[i].borrower).transfer(loanAmount); //contract pay ether to loaner
                balance = balance - loanAmount;
            }
        }
        //assuming this is for the checkLoan function
        //However, if A fails to repay the loan within the deadline, the contract transfers
        // the ownership of the NFT to B and keeps the staked DEX tokens.
    }
    

    function checkLoan(uint256 loanId) external {
        /*
        this function allows the owner of the contract to check the
status of a loan. If the loan’s repayment deadline has passed without repayment, the
function must take the necessary steps to punish the borrower (described in
loanByNft function).
        */
        //pre conditions
        require(msg.sender == owner, "You are not the contract owner"); 
        require(loans[loanId].borrower != address(0) && loans[loanId].isBasedNft, "Loan does not exist");
        
        uint256 currentTime = block.timestamp;
        loans[loanId].amount = 1; // DELETE
        if(currentTime > loans[loanId].deadline && loans[loanId].amount > 0){
            address borrower = loans[loanId].borrower;
            address lender = loans[loanId].lender;

            // transfer ownership of the NFT to B and keep staked DEX
            IERC721(loans[loanId].nftContract).transferFrom(borrower,lender,loans[loanId].nftId);

            // end the loan and stuff -> if without repayment

        }
    }
    
    function getAvailableNFTs () public view { //see the available NFTs to lend ETH to other users

    }

    function getBorrowedEth () public view {

    }

    function getNotPaidBack () public view {
        
    }

    function getTotalBorrowedAndNotPaidBackEth() public view {
        
    }
}
