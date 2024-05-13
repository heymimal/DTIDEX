// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract DEX is ERC20 {
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

    constructor() ERC20("Decentralized Exchange", "DEX") {
        owner = msg.sender;
        maxLoanDuration = 1 days;
        rateEthToDex = 1;
        ethTotalBalance = 0;
        _mint(msg.sender, 10^30);
    }

    function buyDex() external payable {
        require (msg.value >= 1 ether, "At least one ether required");
    }

    function getDex() public returns (uint256) {

    }
}