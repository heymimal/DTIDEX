// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter public nftIdCounter;
    uint256 public mintPrice = 100 wei;
 
    constructor() payable ERC721("Simple NFT", "SNFT") 
            Ownable(msg.sender){
    }

    function mint () external payable {
        require(mintPrice <= msg.value, "Value needs to be greater or equal. ");
        nftIdCounter.increment();
        uint256 nftId = nftIdCounter.current();
        _mint(msg.sender,nftId);
    }

    function getLatestId() public view returns (uint256){
        return nftIdCounter.current();
    }
}
