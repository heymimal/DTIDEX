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
var idIntervalMap = new Map();

const defi_contractAddress = "0xeacc79B5B62D2A8CA5fa133300bdeE7e551d88EA";
const defi_contract = new web3.eth.Contract(defi_abi, defi_contractAddress);

const nft_contractAddress = "0x1618DCCFF27f8609FEfb7b5E1D98fa3EceE821b3";
const nft_contract = new web3.eth.Contract(nft_abi, nft_contractAddress);

const addressZero = "0x0000000000000000000000000000000000000000";
var isOwner = false;
async function connectMetaMask() {
   
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
            document.getElementById('dex-tab').classList.remove('disabled');
            document.getElementById('nft-tab').classList.remove('disabled');
            document.getElementById('DEX info').style.display = 'block';
            setInterfaceBalance();
            setInterfaceDex();
            setInterfaceSwapRate();
            changeType(DEX);
            if(isOwner){
                await listenToLoanCreation();
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
            window.alert("Changed swapRate!");
            } catch (error) {
            window.alert("An error has ocurred");
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
        window.alert(`DEX successfully bought!`);
        console.log(`DEX successfully bought for account ${fromAddress}`);
        refreshInterface();
    } catch (error) {
        window.alert("An error has ocurred");
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
        window.alert(`DEX successfully sold!`);
    } catch (error) {
        window.alert("An error has ocurred");
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
        window.alert("An error has ocurred");
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
        window.alert("Operation done succesfully. ");
        refreshInterface();
    } catch (error) {
        window.alert("An error has ocurred");
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

async function displayAvailableNFTs(){
    const availableNFTs = await getAvailableNfts();
    const availableNftsContainer = document.getElementById('availableNfts');
    availableNftsContainer.innerHTML = ''; // Clear previous results
    if (availableNFTs.length == 0) {
        availableNftsContainer.innerHTML = '<p>No available NFTs.</p>';
        return;
    }
    console.log(availableNFTs.length);
    for (let i = 0; i < availableNFTs.length; i++){
        const nftId = parseInt(availableNFTs[i][0]);
        const price = parseInt(availableNFTs[i][1]);
        const nftElement = document.createElement('div');
        nftElement.classList.add('list-group-item');
        nftElement.innerHTML = `
            <strong>NFT ID:</strong> ${nftId} <br>
            <strong>Price:</strong> ${price} Wei
        `;
        availableNftsContainer.appendChild(nftElement);
        }
    }


async function getTotalBorrowedAndNotPaidBackEth() {
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    try {
        const notpaid = await defi_contract.methods.getTotalBorrowedAndNotPaidBackEth().call({
            from: fromAddress,
        })
        return notpaid;
    } catch (error) {
        console.error("error in this",error);
    }
}

async function displayGetTotalBorrowedAndNotPaidBackEth(){
    const totalBorrowed = await getTotalBorrowedAndNotPaidBackEth();
    const availableNftsContainer = document.getElementById('borrowedETH');
    availableNftsContainer.innerHTML = ''; // Clear previous results
    if (totalBorrowed.length == 0) {
        availableNftsContainer.innerHTML = '<p>You have no debts, congratulations.</p>';
        return;
    }
    console.log(totalBorrowed.length);
    console.log(totalBorrowed);
    for (let i = 0; i < totalBorrowed.length; i++){
        const loanId = parseInt(totalBorrowed[i][0]);
        const price = parseInt(totalBorrowed[i][1]);
        const nftElement = document.createElement('div');
        nftElement.classList.add('list-group-item');
        nftElement.innerHTML = `
            <strong>Loan ID:</strong> ${loanId} <br>
            <strong>Debt remaining:</strong> ${price} Wei
        `;
        availableNftsContainer.appendChild(nftElement);
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

        await defi_contract.methods.loanIdCounter.call();
        const id = await getLoanId();
        console.log(id);
        window.alert("NFT Loan has been created with id: " + id);
        document.getElementById("LoanNftId").value = 0;
        document.getElementById('loanAmountNft').value = 0;
        refreshInterface();
    } catch (error) {
        window.alert("An error has ocurred!");
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
        window.alert("NFT with the id",nftId,"has been removed from the loans");
    } catch (error) {
        console.error("Error canceling nft loan", error);
        window.alert("An error has ocurred");
    }
}

async function loanByNft() {
    const nftId = document.getElementById('reqloanNftId').value;
    const availableNFTs = await getAvailableNfts();
    var price = 0;
    for (let i = 0; i < availableNFTs.length; i++){
        if(parseInt(availableNFTs[i][0]) == nftId){
            price = parseInt(availableNFTs[i][1]);
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
            window.alert("Loan with id ", id, " has been succesfuly started");
        } catch (error) {
            console.error("error in loanbynft", error);
            window.alert("An error has occurred");
        }
    }
    // TODO: implement this
}

async function checkLoan() {
    const loanId = document.getElementById('checkLoanId').value;
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        await defi_contract.methods.checkLoan(loanId).send({
            from: fromAddress,
            gas: gasLimit,
        });
        } catch (error) {
            window.alert("Loan is not active/has been terminated");
            console.error("Error checking loan:", error);
    }
}

async function checkLoanStatus(id) {
    console.log(id);
    let intervalId =  setInterval(() => checkLoanDisp(id), 1 * 60 * 1000);
    idIntervalMap.set(id,intervalId);
    console.log(idIntervalMap);
}

async function listenToLoanCreation() {
    defi_contract.events.loanCreated()
      .on('data', event => {
        
        displayLogStuff(event.returnValues);
		})
      .on('error', error => {
        console.error('Error listening to loan creation:', error);
      });
    console.log('Listening to loan creation events...');
 
}


async function displayLogStuff(values){
    await addId();
    const id = loanIds[loanIds.length - 1];
    const loanEventsDiv = document.getElementById('loanEvents');
    const loanElement = document.createElement('div');
    var date;
    console.log(values.deadline );
    if(values.deadline == 0){
        date = "Not yet started!";
    } else {
        date =new Date(values.deadline * 1000).toLocaleString();
    }
    loanElement.classList.add('list-group-item');
    loanElement.innerHTML = `
        <strong>Loan ID:</strong> ${id} <br>
        <strong>Borrower:</strong> ${values.borrower} <br>
        <strong>Amount:</strong> ${values.amount} Wei <br>
        <strong>Deadline:</strong> ${date} <br>
    `;
    loanEventsDiv.appendChild(loanElement);
    await checkLoanStatus(id);
}

async function checkLoanDisp(id){
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];
    console.log("checking");
    try {
        await defi_contract.methods.checkLoan(id).send({
            from: fromAddress,
            gas: gasLimit,
        });
        } catch (error) {
            console.error("Error checking loan:", error);
            displayError(id);
            const intervalId = idIntervalMap.get(id);
            clearInterval(intervalId)
            idIntervalMap.delete(id);
    }
}


async function displayError(id){
    const loanEventsDiv = document.getElementById('loanEvents');
    const loanElement = document.createElement('div');
    loanElement.classList.add('list-group-item');
    loanElement.innerHTML = `
        <strong>Loan ended:</strong> ${id} <br>
    `;
    loanEventsDiv.appendChild(loanElement);
}

async function addId(){
    const x = await getLoanId();
    loanIds.push(x);
    return x;
}


async function mintNft(){ // TO DO
    const fromAddress = (await window.ethereum.request({
        method: "eth_accounts",
    }))[0];

    try {
        const nftId = await nft_contract.methods.mint().call({
            from: fromAddress,
            value: 100,
            gas: gasLimit
        })
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
window.getAvailableNfts = displayAvailableNFTs;
window.mintNft = mintNft;
window.setInterfaceSwapRate = setInterfaceSwapRate;
window.setInterfaceBalance = setInterfaceBalance;
window.setInterfaceDex = setInterfaceDex;
window.getTotalBorrowedAndNotPaidBackEth = displayGetTotalBorrowedAndNotPaidBackEth;
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