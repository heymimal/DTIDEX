import { defi_abi } from "./abi_decentralized_finance.js";
import { nft_abi } from "./abi_nft.js";
/*if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
    var web3 = new Web3(window.ethereum);
} else {
    console.log('MetaMask is not installed. Connecting to Ganache...');
    
}*/
const gasLimit = 300000; // Adjust this value as needed
const ethereum = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
//const web3 = new Web3();
var web3 = new Web3(ethereum);
var loanIds = [];

const defi_contractAddress = "0x42459861c3CA136EC3648dE04c881A6C93d8A503";
const defi_contract = new web3.eth.Contract(defi_abi, defi_contractAddress);

const nft_contractAddress = "0x8901f3BC321FDE4556843C6039dEbB62492762dC";
const nft_contract = new web3.eth.Contract(nft_abi, nft_contractAddress);

const addressZero = "0x0000000000000000000000000000000000000000";
var isOwner = false;
async function connectMetaMask() {
    document.getElementById('DEX info').style.display = 'block';
    if (ethereum) {
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            console.log("Connected account:",accounts[0] );
            const owner = await defi_contract.methods.owner().call();
            console.log("Contract owner:", owner);
            isOwner = (accounts[0].toLowerCase() ===  owner.toLowerCase());
            console.log(isOwner);
            setInterfaceBalance();
            setInterfaceDex();
            setInterfaceSwapRate();
            changeType(DEX);
            if(isOwner){
                await listenToLoanCreations();
            }
            
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
        }
        
    } else {
        console.error("MetaMask not found. Please install the MetaMask extension.");
    }
}

async function setRateEthToDex() {
    const swapRate = document.getElementById('newdexSwapRate').value;
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    if(swapRate > 0){
        try {
            await defi_contract.methods.setDexSwapRate(swapRate).send({
                from: fromAddress,
            });
            setInterfaceSwapRate();
            } catch (error) {
            console.error("Error setting DEX rate:", error);
        }
    }
}


async function buyDex() {

    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    const dex_amount = document.getElementById('buyEthAmount').value;
    const swapRate = await getRateEthToDex();

    try {
        await defi_contract.methods.buyDex().send({
            from: fromAddress,
            value: dex_amount * swapRate,
        });
        document.getElementById("buyEthAmount").value = 0;
        console.log(`DEX successfully bought for account ${fromAddress}`);
        refreshInterface();
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
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        const amountSell = document.getElementById("sellDexAmount").value;
        await defi_contract.methods.sellDex(amountSell).send({
            from: fromAddress,
        });
        document.getElementById("sellDexAmount").value ="";
        refreshInterface();
        console.log("Successfuly sold DEX");
    } catch (error) {
        console.error("Error selling DEX:", error);
    }
}

async function loan() {
    const dexStake = document.getElementById("loanDexAmount").value;
    const deadline = document.getElementById('loanDeadlineDex').value;

    console.log(dexStake);
    console.log(deadline);
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    try {
        const loanId = await defi_contract.methods.loan(dexStake, deadline).send({
                from: fromAddress,
                gas: gasLimit
            });
        document.getElementById("loanDexAmount").value = 0;
        const id = await getLoanId();
        console.log(id);
        window.alert("Loan has been created with id: " + id);
        refreshInterface();
        return loanId; // maybe create popup saying loan with id has been created?
    } catch (error) {
        console.error("Error creating loan:", error);
    }
    
}

async function returnLoan() {
    const loanId = document.getElementById('returnLoanId').value;
    const weiAmount = document.getElementById('returnWeiAmount').value;

    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        await defi_contract.methods.returnLoan(loanId).send({
            from: fromAddress,
            value: weiAmount,
            gas: gasLimit
        });
        refreshInterface();
    } catch (error) {
        console.error("Error returning loan:", error);
    }
}

async function getEthTotalBalance() {
    const ethBalance = await defi_contract.methods.getBalance().call();
    return ethBalance;
}

async function getRateEthToDex() {
    const rate = await defi_contract.methods.getDexSwapRate().call();
    return rate;
}

async function getLoanId(){
    const id = await defi_contract.methods.getLoanId().call();
    return id;
}


async function getAvailableNfts() {
    const availableNFTs = await defi_contract.methods.getAvailableNFTs().call();
    console.log(availableNFTs);
    return availableNFTs; //show them off somewhere
}

async function getTotalBorrowedAndNotPaidBackEth() {
    // TODO: implement this
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    try {
        const notpaid = await defi_contract.methods.getTotalBorrowedAndNotPaidBackEth().send({
            from: fromAddress,
        })
        console.log(notpaid);
    } catch (error) {
        console.error("error in this",error);
    }
}

async function makeLoanRequestByNft() {
    const nftId = document.getElementById('LoanNftId').value;
    const loanNftAmount = document.getElementById('loanAmountNft').value;
    const deadline = document.getElementById('loanDeadlineNft').value;

    if (!nftId || !loanNftAmount || !deadline) {
        console.error("All input fields are required.");
        return;
    }

    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        await nft_contract.methods.approve(defi_contractAddress,nftId).send({
            from: fromAddress,
            gas: gasLimit
        })
        const loanId = await defi_contract.methods.makeLoanRequestByNft(nft_contractAddress,
            nftId,loanNftAmount, deadline).send({
                from: fromAddress,
                gas: gasLimit
            });

        const id = await defi_contract.methods.loanIdCounter.call();
        console.log("id is :" + id);
        document.getElementById("LoanNftId").value = '0';
        document.getElementById('loanAmountNft').value = '0'
        refreshInterface();
        console.log(loanId);
        return loanId; // maybe create popup saying loan with id has been created?
    } catch (error) {
        console.error("Error creating nft loan:", error);
    }
    // TODO: implement this
}

async function cancelLoanRequestByNft() {
    const nftId = document.getElementById('cancelNftId').value;

    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        
        await defi_contract.methods.cancelLoanRequestByNft(nft_contractAddress,nftId).send({
            from : fromAddress,
            gas: gasLimit
        })
        await nft_contract.methods.approve(addressZero,nftId).send({
            from: fromAddress,
            gas: gasLimit
        })

    } catch (error) {
        console.error("Error canceling nft loan", error);
    }
    
    // TODO: implement this
}

async function loanByNft() {
    const nftId = document.getElementById('reqloanNftId')
    const availableNFTs = await getAvailableNfts();
    const price = 0;
    for (let i = 0; i < availableNFTs.lenght; i+=2){
        if(availableNFTs[i] == nftId){
            price = availableNFTs[i+1];
        }
    }

    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];


    if(price != 0){
        try {
            await defi_contract.methods.loanByNft(nft_contractAddress,nftId).send({
                from: fromAddress,
                value:price,
                gas: gasLimit
            })
            refreshInterface();
        } catch (error) {
            console.error("error in loanbynft", error);
        }
    }
    // TODO: implement this
}

async function checkLoan() {
    const loanId = document.getElementById('checkLoanId').value;
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    console.log("in here!");
    try {
        await defi_contract.methods.checkLoan(loanId).send({
            from: fromAddress,
            gas: gasLimit,
        });
        } catch (error) {
        console.error("Error checking loan:", error);
    }
}

async function checkLoanStatus() {
    // TODO: implement this checking status of every created loan
}

async function listenToLoanCreation() {
    // TODO: implement this
}

async function listenToLoanCreations() {
	//const logBox = document.getElementById("logBox");
     defi_contract.events.loanCreated()
      .on('data', event => {
        console.log(event.returnValues);
        //logBox.value += event.returnValues;
        addId();
		})
      .on('error', error => {
        console.error('Error listening to loan creation:', error);
      });
	
    console.log('Listening to loan creation events...');
	
   // intervalId = setInterval(checkLoanStatus(event.returnValues.id), 10 * 60 * 1000); 
 
}

async function addId(){
    const x = await getLoanId();
    loanIds.push(x);
}


async function mintNft(){ // TO DO
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        const nftId = await nft_contract.methods.mint().send({
            from: fromAddress,
            value: 100, 
            gas: gasLimit
        })
        console.log(nftId);
        return nftId; // do something with this!
    } catch (error) {
        console.error("error in mint!", error)
    }
    console.log("minting nft...");
}

//interface
async function setInterfaceDex(){
    const dexBalance = await getDex();
    const dexBalanceElem = document.getElementById("dexBalance");
    dexBalanceElem.innerHTML = ` ${dexBalance} `;
}

async function setInterfaceSwapRate(){
    const swapRate = await getRateEthToDex();
    const swapRateElem = document.getElementById("swapRate");
    swapRateElem.innerHTML = ` ${swapRate} `;
    console.log(swapRate);
}

async function setInterfaceBalance(){
    const contractEth = await getEthTotalBalance();
    const contractEthElem = document.getElementById("contractEth");
    contractEthElem.innerHTML = ` ${contractEth} `;
}

async function refreshInterface(){
    await setInterfaceBalance();
    await setInterfaceDex();
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
window.setInterfaceSwapRate = setInterfaceSwapRate;
window.setInterfaceBalance = setInterfaceBalance;
window.setInterfaceDex = setInterfaceDex;
window.getTotalBorrowedAndNotPaidBackEth = getTotalBorrowedAndNotPaidBackEth;
window.checkLoanStatus = checkLoanStatus;
window.changeType = changeType;



function changeType(method){
var nftMethods = document.getElementById('NFT');
var dexMethods = document.getElementById('DEX');
var ownerMethods = document.getElementById('owner');
    if(method == DEX){
    nftMethods.style.display = 'none';
    dexMethods.style.display = 'block';
    if(isOwner){
        ownerMethods.style.display = 'block';
    }
    } else {
        nftMethods.style.display = 'block';
        dexMethods.style.display = 'none';
        ownerMethods.style.display = 'none';
    }
}