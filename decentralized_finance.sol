// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
        _mint(address(this), 10**18);

    }

    function buyDex() external payable { // buy DEX tokens
        // check values for DEX exchange and contract ether balance
        require(msg.value >= dexSwapRate, "Insufficient amount in msg"); // value in eth
        uint256 remaining = msg.value % dexSwapRate;
        
        uint256 tokenAmount = msg.value/dexSwapRate;
        require(tokenAmount <= balanceOf(address(this)),"Not sufficient tokens for sale");
        uint256 balanceBefore = balance;
        if(remaining != 0){ // returning extra
            payable(msg.sender).transfer(remaining);
            balance -= remaining;
        }
        //Transfer DEX and ETH
        _transfer(address(this), msg.sender,tokenAmount);
        balance += msg.value;
        //dexSwapRate +=1; //rules??
        dexSwapRate += (dexSwapRate/10) * ((balance/100000) - (balanceBefore/100000));
    }

    function sellDex(uint256 dexAmount) external { // sell his/her DEX tokens
        // check values for DEX exchange and contract ether balance
        require(dexAmount > 0, "No DEX coins were provided");
        require(balanceOf(address(msg.sender)) >= dexAmount,"User does not have enough coins");
        uint256 ethToTrade = dexAmount * dexSwapRate;
        require(balance >= ethToTrade, "Contract does not have sufficient ETH");
        uint256 balanceBefore = balance;
        //transfer DEX and Eth
        balance = balance - ethToTrade;
        _transfer(msg.sender, address(this),dexAmount);
        payable(msg.sender).transfer(ethToTrade);
        //dexSwapRate -= 1; // rules??
        dexSwapRate -= (dexSwapRate/10) * ((balanceBefore/100000) - (balance/100000));
    }

    function loan(uint256 dexAmount, uint256 deadline) external returns(uint256) { //ask for a loan
        //pre-conditions
        require(balanceOf(msg.sender) >= dexAmount,"User does not have enough DEX tokens.");
        require(deadline <= maxLoanDuration, "Loan duration should not exceed the maximum loan duration");
        
        //maybe add checks to remaining dex if trade isn't linear
        uint256 weight = dexSwapRate/(2 * maxLoanDuration);
        uint256 weightedSwapRate = (dexSwapRate + weight) - weight*deadline;
        uint256 ethAmount = dexAmount* weightedSwapRate;
        require(ethAmount <= balance, "Not enough ETH in the contract");
        uint256 balanceBefore = balance;
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
        //dexSwapRate = dexSwapRate + 1; // rules?
        dexSwapRate += (dexSwapRate/10) * ((balanceBefore/100000) - (balance/100000));
        return loanID;
    }

   

    function returnLoan(uint256 loanId) external payable {
        require(loans[loanId].borrower == msg.sender, "Id not valid or Loan's borrower does not match");
        // && msg.value % dexSwapRate == 0
        require(msg.value >= dexSwapRate, "Value needs to be higher and correct.");
        
        uint256 returning = 0; // might remove
        uint256 dex = 0;
        uint256 debt = loans[loanId].amount; // money to return
        address to;
        bool finished;
        uint256 balanceBefore = balance;

        if(debt <= msg.value){
            returning = msg.value - debt; //return money to user if extra was sent
            dex = loans[loanId].amount/dexSwapRate;
        } else {
            dex = msg.value/dexSwapRate;
        }
        if(loans[loanId].isBasedNft){ // if nft has to fully return
            require(debt <= msg.value,"For a NFT based loan, all value must be repaid");
            dex = (msg.value - debt/11) / dexSwapRate; // contract keeps 10%
            to = loans[loanId].lender; //send to lender (B)
            delete loans[loanId];
        } else {
            to = msg.sender; //send coins to user
            if (debt > msg.value){
                loans[loanId].amount = loans[loanId].amount  - msg.value;
            } else {
                delete loans[loanId];
                finished = true;
            }
        }

        if (to != address(0)){
            _transfer(address(this), to,dex);
        }

        balance += msg.value; 
        if(returning > 0){ //payback extra money
            payable(address(msg.sender)).transfer(returning);
            balance -= returning;
        }

        if (finished) { //loan has been deleted
            //dexSwapRate = dexSwapRate - 1; //rules
            dexSwapRate -= (dexSwapRate/10) * ((balance/100000) - (balanceBefore/100000));
        }
    
                     
    }

    function getBalance() public view returns (uint256) {
       // require (msg.sender == owner, "You are not the owner");
       // "when called by the contract owner" but users are supposed to be able 
       // see the total amount of ETH the contract has
        return balance;
    }

    function getLoanId() public view returns (uint256) {
        return loanIdCounter.current();
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

    function makeLoanRequestByNft(IERC721 nftContract, uint256 nftId, uint256 loanAmount, uint256 deadline) external returns(uint256){ // for this to work, owner of the nft needs to approve the dex contract 
        // check if sender owns the nft
        require(nftContract.ownerOf(nftId) == msg.sender, "You do not own this NFT");

        //assuming maxDeadline is only related to the direct contracts
        //create loan
        Loan memory newLoan = Loan(address(0),msg.sender,deadline,loanAmount,true,address(nftContract),nftId);
        loanIdCounter.increment();
        uint256 loanID = loanIdCounter.current();
        loans[loanID] = newLoan;
        emit loanCreated(loans[loanID].borrower, loanAmount, deadline);
        return loanID;
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId) external {
        for (uint256 i = 0; i <= loanIdCounter.current(); i++){
            if(loans[i].isBasedNft && loans[i].nftContract == address(nftContract) && loans[i].lender == address(0)
            && loans[i].nftId == nftId){ //can only cancel if there is no lender
                delete loans[i];
                break;
             }
        }
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // NFT contract creation
        for (uint256 i = 1;i <= loanIdCounter.current() ; i++) 
        { 
            console.log(nftId);
            bool check = loans[i].isBasedNft == true && loans[i].nftId == nftId 
                && loans[i].nftContract == address(nftContract);
            console.log(check);
            if(check) { // search for the nft given
                require(msg.sender != loans[i].borrower, "This is a loan requested by you."); // "another user B"
                
                //pre-conditions
                uint256 loanAmount = loans[i].amount;
                uint256 dex = loanAmount/dexSwapRate;
                require(balanceOf(msg.sender) >= dex, "You do not have enough DEX coins for this transaction.");
                require(balance >= loanAmount, "Contract does not have enough Ether");
                
                loans[i].lender = msg.sender;
                
                uint256 dl = block.timestamp;
                uint256 deadlineInSeconds;
                //activate loan duration here?
                if(loans[i].deadline == 0){
                    deadlineInSeconds = 60;
                } else {
                    deadlineInSeconds = loans[i].deadline * 86400;
                }
                loans[i].deadline = dl + deadlineInSeconds; // deadline activated
                //adding a % of the loan for the contract -> 10%
                loans[i].amount = loans[i].amount + (loans[i].amount/10);

                 //transfer DEX and Eth
                _transfer(address(msg.sender), address(this), dex); //lender pays dex to contract ("locks")
                payable(loans[i].borrower).transfer(loanAmount); //contract pay ether to loaner
                console.log(balance);
                balance = balance - loanAmount;
                console.log(balance);
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
        require(loans[loanId].borrower != address(0), "Loan does not exist");
        
        uint256 currentTime = block.timestamp;
        if(currentTime > loans[loanId].deadline && loans[loanId].amount > 0){
            address borrower = loans[loanId].borrower;
            address lender = loans[loanId].lender;
            if (loans[loanId].isBasedNft){  // transfer ownership of the NFT to B 
                address nftContract = loans[loanId].nftContract;
                uint256 nftId = loans[loanId].nftId;
                IERC721(nftContract).transferFrom(borrower,lender,nftId);
            }
           delete loans[loanId];
        }
    }

    struct NftInfo {
        uint256 nftId;
        uint256 loanPrice;
    }
    
    function getAvailableNFTs () public view returns (NftInfo[]memory){ //see the available NFTs to lend ETH to other users
        uint256 count = 0;
        for (uint256 i = 1;i <= loanIdCounter.current() ; i++) {
            if(loans[i].isBasedNft){ // to filter out unavailable loans
                //add nft to return
                count++;
            }
        }
        NftInfo[] memory availableNFTs = new NftInfo[](count);
        uint256 index = 0;

        for (uint256 i = 0;i <= loanIdCounter.current() ; i++) {
            if(loans[i].isBasedNft && loans[i].lender == address(0)){ ///get the loans and add to list
                availableNFTs[index] = NftInfo(loans[i].nftId,loans[i].amount);
                index++;
            }
        }

        return availableNFTs; // return list

    }

    struct LoanInfo {
        uint256 loanId;
        uint256 debt;
    }
    

    function getTotalBorrowedAndNotPaidBackEth() public view returns (LoanInfo[]memory) {
        uint256 count = 0;
        for (uint256 i = 1;i <= loanIdCounter.current() ; i++) {
            if(loans[i].borrower == msg.sender && loans[i].lender != address(0)){
                count++;
            }
        }

        LoanInfo[] memory notPaidBack = new LoanInfo[](count);
        uint256 index = 0;
        for (uint256 i = 0;i <= loanIdCounter.current() ; i++) {
            if(loans[i].borrower == msg.sender  && loans[i].lender != address(0)){ ///get the loans and add to list
                notPaidBack[index] = LoanInfo(i,loans[i].amount);
                index++;
            }
        }

        return notPaidBack;
    }
}
