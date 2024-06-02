# DTIDEX
Authors:
    - fc52751 Rafael Abrantes
    - fc54409 Miguel Reis
    - fc56337 Diogo Pedro
    - Group 8
## RUNNING THE PROJECT
#### MetaMask
 - To run using the Metamask contract, just run as it is.
 - Open a CMD in the project folder and run "python -m http.server 8080";
 - Open the browser on "http://127.0.0.1:8080" and click on Connect Metamask
#### Ganache
 - To run on ganache, comment lines 5 to 12 on main.js, and uncomment line 16 on main.js
 - The project was tested utilizing ganache local blockchain network;
 - Information about how to setup ganache local network can be found in this link: https://ferdyhape.medium.com/remix-ide-and-ganache-a-beginners-guide-to-smart-contract-deployment-b0df68c48ae6;
 - After having ganache running we need to deploy the decentralized_finance.sol and nft.sol, using REMIX IDE;
 - Update the abi_decentralized_finance.js and abi_nft.js file with the respective ABI;
 - Update the lines 23 and 26 from the file main.js with the respective contract adresses;
 - Open a CMD in the project folder and run "python -m http.server 8080";
 - Add the ganache accounts to Metamask;
 - Open the browser on "http://127.0.0.1:8080" and click on Connect Metamask

#### DEX to WEI exchange rate rule:
 - Everytime the contract gains 100000 WEI we increase the swap rate by 10%, this is checked when someone buys DEX or loans ETH;
 - Everytime the contract loses 100000 WEI we decrease the swap rate by 10%, this is checker when someone sells DEX or returns a loans;
 - When loaning, the swap rate is calculated using the following formula: SwapRate + (SwapRate/(2 * maxLoanDuration)) - ((SwapRate/(2 * maxLoanDuration)) * loanDuration)

#### Notes
 - All methods were implemented, except getAllTokenURIs.
 - Added a percentage of the amount (10%) related to the loan NFTs that is sent to the contract.