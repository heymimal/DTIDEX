

/*if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
    var web3 = new Web3(window.ethereum);
} else {
    console.log('MetaMask is not installed. Connecting to Ganache...');
    
}*/
const ethereum = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
//const web3 = new Web3();
var web3 = new Web3(ethereum);
// the part is related to the DecentralizedFinance smart contract
const defi_contractAddress = "0x915E454d216EA37F29b392974dD77312f38b05fa";
import { defi_abi } from "./abi_decentralized_finance.js";
const defi_contract = new web3.eth.Contract(defi_abi, defi_contractAddress);

// the part is related to the the SimpleNFT smart contract
const nft_contractAddress = "0xF267b4d86fd51CbC20A26EF6b6333A31849e7Ab1";
import { nft_abi } from "./abi_nft.js";
const nft_contract = new web3.eth.Contract(nft_abi, nft_contractAddress);

async function connectMetaMask() {
    document.getElementById('DEX info').style.display = 'block';
    if (ethereum) {
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            console.log("Connected account:", accounts[0]);
            setInterfaceBalance();
            setInterfaceDex();
            setInterfaceSwapRate();
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
        }
        
    } else {
        console.error("MetaMask not found. Please install the MetaMask extension.");
    }
}

async function setRateEthToDex() {
    // TODO: implement this
}

async function checkLoanStatus() {
    // TODO: implement this
}

async function buyDex() {

    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    const lastRate = await getRateEthToDex();

    try {
        await defi_contract.methods.buyDex().send({
            from: fromAddress,
            value: document.getElementById("tokenAmountBuy").value,
        });
        //document.getElementById("tokenAmountBuy").value = "";
        console.log(`DEX successfully bought for account ${fromAddress}`);
        setInterfaceBalance();
        setInterfaceDex();
    } catch (error) {
        console.error("Error buying DEX:", error);
    }
}

async function getDex() {
    
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    const dexBalance = await defi_contract.methods.getDexBalance().call({
        from: fromAddress,
    });
    return dexBalance;
}

async function sellDex() {
    // TODO: implement this
}

async function loan() {
    // TODO: implement this
}

async function returnLoan() {
    // TODO: implement this
}

async function getEthTotalBalance() {
    
    const ethBalance = await defi_contract.methods.getBalance().call();
    return ethBalance;
}

async function getRateEthToDex() {
    
    const rate = await defi_contract.methods.getDexSwapRate().call();
    return rate;
}


async function getAvailableNfts() {
    // TODO: implement this
}

async function getTotalBorrowedAndNotPaidBackEth() {
    // TODO: implement this
}

async function makeLoanRequestByNft() {
    // TODO: implement this
}

async function cancelLoanRequestByNft() {
    // TODO: implement this
}

async function loanByNft() {
    // TODO: implement this
}

async function checkLoan() {
    // TODO: implement this
}

async function listenToLoanCreation() {
    // TODO: implement this
}

async function getAllTokenURIs() {
    // TODO: implement this
}

async function mintNft(){
    console.log("minting nft...");
}

//interface
async function setInterfaceDex(){
    console.log("!");
    const dexBalance = await getDex();
    const dexBalanceElem = document.getElementById("dexBalance");
    dexBalanceElem.innerHTML = ` ${dexBalance} `;
}

async function setInterfaceSwapRate(){
    console.log("!");
    const swapRate = await getRateEthToDex();
    const swapRateElem = document.getElementById("swapRate");
    swapRateElem.innerHTML = ` ${swapRate} `;
    console.log(swapRate);
}

async function setInterfaceBalance(){
    console.log("!");
    const contractEth = await getEthTotalBalance();
    const contractEthElem = document.getElementById("contractEth");
    contractEthElem.innerHTML = ` ${contractEth} `;
}


window.connectMetaMask = connectMetaMask;
window.buyDex = buyDex;
window.getDex = getDex;
window.sellDex = sellDex;
window.loan = loan;
window.returnLoan = returnLoan;
window.getEthTotalBalance = getEthTotalBalance;
window.setRateEthToDex = setRateEthToDex;
window.getRateEthToDex = getRateEthToDex;
window.makeLoanRequestByNft = makeLoanRequestByNft;
window.cancelLoanRequestByNft = cancelLoanRequestByNft;
window.loanByNft = loanByNft;
window.checkLoan = checkLoan;
window.listenToLoanCreation = listenToLoanCreation;
window.getAvailableNfts = getAvailableNfts;
window.mintNft = mintNft;
/*windows.getTotalBorrowedAndNotPaidBackEth = getTotalBorrowedAndNotPaidBackEth;
windows.checkLoanStatus = checkLoanStatus;
windows.getAllTokenURIs = getAllTokenURIs;*/