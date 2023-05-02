import { WalletGlobal } from './WalletGlobal.js';
import { ethers } from './ethers.min.js';
import { AccountArray } from './Account.js';

const seedPhrase = WalletGlobal.WalletSeedPhrase;
const password = WalletGlobal.WalletPassword;

if (!password || password === "null") {
  chrome.tabs.create({url: 'Page/CreatePassword.html'});
} 
else 
{
  if (!seedPhrase || seedPhrase === "null") {
    chrome.tabs.create({url: 'Page/OnBoard.html'});
  } 
}

const walletAccounts = WalletGlobal.WalletAccounts;
const walletNetworkEndpoint = WalletGlobal.WalletNetworkEndpoint;

const provider = new ethers.providers.JsonRpcProvider(walletNetworkEndpoint);
const ddnAccounts = document.getElementById("ddnAccounts");
const ethBalance = document.getElementById("ethBalance");
const accountAddress = document.getElementById("accountAddress");
const txtAccountName = document.getElementById("txtAccountName");
const txtprivatekey=document.getElementById("txtprivatekey");
const dvChangeAccountName = document.getElementById("dvChangeAccountName");
const dvImportAccount=document.getElementById("dvImportAccount");
const dvSendETH = document.getElementById("dvSendETH");
const dvSettings = document.getElementById("dvSettings");
const currentETHGasPrice = document.getElementById("ethGasPrice");
const txtNetowrk = document.getElementById("txtNetowrk");
const txtSendGasLimit = document.getElementById("txtSendGasLimit");
const txtSendGasPrice = document.getElementById("txtSendGasPrice");
const btnGasLimit = document.getElementById("btnGasLimit");
const txtGasLimit = document.getElementById("txtGasLimit");
const btnGasPrice = document.getElementById("btnGasPrice");
const txtGasPrice = document.getElementById("txtGasPrice");
const btnExpandView = document.getElementById('btnExpandView');

txtNetowrk.value = walletNetworkEndpoint;


fetchGasPrice();

async function fetchGasPrice() {
  const gasPrice = await provider.getGasPrice();
  const formattedGasPrice = ethers.utils.formatUnits(gasPrice, 'gwei');
  console.log('Current gas price:', formattedGasPrice, 'gwei');
  currentETHGasPrice.textContent = formattedGasPrice;
}


document.addEventListener('DOMContentLoaded', function() {
  
    if(btnExpandView != null){
      btnExpandView.addEventListener('click', function() {
        ExpandView();
      });
    }

    btnGasPrice.addEventListener('click', function() {
      SetGasPrice();
    });

    var btnChangeAccountName = document.getElementById('btnChangeAccountName');
    btnChangeAccountName.addEventListener('click', function() {
      ChangeAccountName();
    });

    
    btnGasLimit.addEventListener('click', function() {
      SetGasLimit();
    });

    var btnAddNewAccount = document.getElementById('btnAddNewAccount');
    btnAddNewAccount.addEventListener('click', function() {
      AddNew();
    });

    var btnImportAccount = document.getElementById('btnImportAccount');
    btnImportAccount.addEventListener('click', function() {
      importPrivateKey();
    });

    var btnImport = document.getElementById('btnImport');
    btnImport.addEventListener('click', function() {
      importAccount();
    });

    var btnSaveAccountName = document.getElementById('btnSaveAccountName');
    btnSaveAccountName.addEventListener('click', function() {
      SaveAccountName();
    });
 
    var btnSendETH = document.getElementById('btnSendETH');
    btnSendETH.addEventListener('click', function() {
      SendETH();
    });

    var btnTranferToAccount = document.getElementById('btnTranferToAccount');
    btnTranferToAccount.addEventListener('click', function() {
      TranferToAccount();
    });

    var btnSettings = document.getElementById('btnSettings');
    btnSettings.addEventListener('click', function() {
      Settings();
    });
   

    var ddnAccounts = document.getElementById('ddnAccounts');
    ddnAccounts.addEventListener('change', function() {
      GetBalance();
    });
   
    LoadAccountFromLocalStroage();
});

function ExpandView()
{
  chrome.tabs.create({url: 'Page/Wallet.html'});
}



function SetGasPrice()
{
  localStorage.setItem('GasPrice',txtGasPrice.value);
}


function SetGasLimit()
{
  localStorage.setItem('GasLimit',txtGasLimit.value);
}

function LoadAccountFromLocalStroage()
{
  
  ddnAccounts.options.length = 0;

  var obj = JSON.parse(localStorage.getItem("Accounts"));
  var accounts = null;

  if (obj === null) {
    CreateNew(0);
    obj = JSON.parse(localStorage.getItem("Accounts"));
    accounts = obj.accounts;
  }
  else 
  {
    accounts = obj.accounts;
      if (accounts === null || accounts.length === 0) {
      CreateNew(0);
      obj = JSON.parse(localStorage.getItem("Accounts"));
      accounts = obj.accounts;
    }
    else 
    {
      accounts = obj.accounts;
    }
  }
    
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.text = account.accountName;
    option.value = account.address;
    ddnAccounts.appendChild(option);
  });

  GetBalance();

}

function CreateNew(index)
{
    const mnemonic = seedPhrase;
    const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    
    const options = [];
    const defaultAccountName='Account '+ (index+1);
    const accountArray = new AccountArray();
    
    const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${index}`);
    const address = ethers.utils.getAddress(childNode.address);
    console.log("defaultAccountName private key:", childNode.privateKey);

    accountArray.addAccount(defaultAccountName, address);

    const jsonString = JSON.stringify(accountArray);
    localStorage.setItem('Accounts', jsonString);
    
}

function AddNew()
{
  ddnAccounts.options.length = 0;

  var obj = JSON.parse(localStorage.getItem("Accounts"));
  var accounts = null;
  accounts = obj.accounts;
  var index = accounts.length;
  
  const mnemonic = seedPhrase;
  const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const options = [];
  const defaultAccountName='Account '+ (index+1);
  const accountArray = new AccountArray();
  
  const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${index}`);
  const address = ethers.utils.getAddress(childNode.address);
  
  
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.text = account.accountName;
    option.value = account.address;
    ddnAccounts.appendChild(option);
    accountArray.addAccount(account.accountName, account.address);
  });

  const option1 = document.createElement('option');
  option1.text = defaultAccountName;
  option1.value = address;
  ddnAccounts.appendChild(option1);
  accountArray.addAccount(defaultAccountName, address);
  
  const jsonString = JSON.stringify(accountArray);
  localStorage.setItem('Accounts', jsonString);
  
  GetBalance();

  ShowInformation(defaultAccountName + " - New Account Added");

}
function importPrivateKey(){
  if (dvImportAccount.style.display === "none") {
    dvImportAccount.style.display = "block";
  } else {
    dvImportAccount.style.display = "none";
  }
}
function importAccount(){
  const privateKey = txtprivatekey.value;
  const wallet = new ethers.Wallet(privateKey);
  //const address = wallet.address;
  
  ddnAccounts.options.length = 0;

  var obj = JSON.parse(localStorage.getItem("Accounts"));
  var accounts = null;
  accounts = obj.accounts;
  var index = accounts.length;
  const options = [];
  const defaultAccountName='Account '+ (index+1);
  const accountArray = new AccountArray();

  const mnemonic = seedPhrase;
  const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${index}`);
  const address = ethers.utils.getAddress(childNode.address);

  accounts.forEach(account => {
    const option = document.createElement('option');
    option.text = account.accountName;
    option.value = account.address;
    ddnAccounts.appendChild(option);
    accountArray.addAccount(account.accountName, account.address);
  });

  const option1 = document.createElement('option');
  option1.text = defaultAccountName;
  option1.value = address;
  ddnAccounts.appendChild(option1);
  accountArray.addAccount(defaultAccountName, address);

  const jsonString = JSON.stringify(accountArray);
  localStorage.setItem('Accounts', jsonString);
  GetBalance();
  dvImportAccount.style.display = "none";

  ShowInformation(defaultAccountName + " - New Account Imported!!!!");
 }



function ChangeAccountName()
{
  if (dvChangeAccountName.style.display === "none") {
    dvChangeAccountName.style.display = "block";
  } else {
    dvChangeAccountName.style.display = "none";
  }
  var selectedText = ddnAccounts.options[ddnAccounts.selectedIndex].text;
  txtAccountName.value = selectedText;
 }

 function Settings()
{
   txtGasLimit.value = localStorage.getItem('GasLimit');
   txtGasPrice.value = localStorage.getItem('GasPrice');
   

  if (dvSettings.style.display === "none") {
    dvSettings.style.display = "block";
  } else {
    dvSettings.style.display = "none";
  }

}

 
function SendETH()
{
  txtSendGasLimit.value = localStorage.getItem('GasLimit');
  txtSendGasPrice.value = localStorage.getItem('GasPrice');
   
  if (dvSendETH.style.display === "none") {
    dvSendETH.style.display = "block";
  } else {
    dvSendETH.style.display = "none";
  }
}

function SaveAccountName()
{
 
  const obj = JSON.parse(localStorage.getItem("Accounts"));
  const accountToUpdate = obj.accounts.find(account => account.address === ddnAccounts.value);

  if (accountToUpdate) {
    accountToUpdate.accountName = txtAccountName.value ;
    console.log("Account updated:", accountToUpdate);
  } else {
    console.log("Account not found.");
  }

  const jsonString = JSON.stringify(obj);
  
  localStorage.setItem('Accounts', jsonString);

  ddnAccounts.options.length = 0;

  obj.accounts.forEach(account => {
    const option = document.createElement('option');
    option.text = account.accountName;
    option.value = account.address;
    ddnAccounts.appendChild(option);
  });

  GetBalance();
  dvChangeAccountName.style.display = "none";

  //LoadAccountFromLocalStroage();
  ShowInformation("Account name changed as " + txtAccountName.value);
}


function GetBalance()
{

  console.log('getBalance Started');
  const checkBalanceAddress = ddnAccounts.value;
  
  const xhr = new XMLHttpRequest();
  xhr.open('POST', walletNetworkEndpoint);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const balance = response.result;
      const balanceInEther = parseFloat(parseInt(balance, 16) / Math.pow(10, 18)).toFixed(2);
      console.log(`Balance of ${checkBalanceAddress}: ${balanceInEther}`);
      console.log('getBalance completed without error');
      ethBalance.textContent = balanceInEther;
      accountAddress.textContent = checkBalanceAddress;
    } else {
      console.log(`Error: ${xhr.status}`);
      console.log('getBalance completed with error');
    }
  }
  };
  xhr.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    mode:'no-cors',
    params: [checkBalanceAddress, 'latest'],
    id: 1
  }));
}


function TranferToAccount()
{
   const fromAddress = ddnAccounts.value;
   const recipientAddress = document.getElementById("sendAddress").value;
   const ethAmount = document.getElementById("enterValue").value;
   const sendGasLimit = parseInt(txtSendGasLimit.value, 16);
   const SendGasPriceTo = ethers.utils.parseUnits(txtSendGasPrice.value, "gwei");
   
   const mnemonic = seedPhrase;
   const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  
   let i = 0;
   var wallet = null;
   while (true) {
     wallet = new ethers.Wallet(rootNode.derivePath(`m/44'/60'/0'/0/${i}`));
     if (wallet.address.toLowerCase() === fromAddress.toLowerCase()) {
       const privateKey = wallet.privateKey;
       console.log(`Private key for address ${wallet.address} is ${privateKey}`);
       break; // exit the loop once a match is found
     } else {
       console.log(`Wallet address ${wallet.address} does not match the target address`);
       i++; // increment the index to check the next address
     }
   }
   wallet = new ethers.Wallet(rootNode.derivePath(`m/44'/60'/0'/0/${i}`));

   const nonce = provider.getTransactionCount(wallet.address);
 
    const tx = {
      to: recipientAddress,
      value: ethers.utils.parseEther(ethAmount), // Amount in Ether
      gasPrice: SendGasPriceTo,
      gasLimit: sendGasLimit,
      nonce: nonce  // Add the correct nonce value here
    }
	   //gasPrice: ethers.utils.parseUnits("100", "gwei"),
     //gasPrice: ethers.utils.parseUnits(currentETHGasPrice.textContent, 9),
      

    // Sign transaction with sender account
    wallet.signTransaction(tx).then((signedTx) => {
      // Send signed transaction to network
      provider.sendTransaction(signedTx).then((txResponse) => {
        console.log("Transaction hash: ", txResponse.hash);
        ShowInformation("ETH Transfer Submitted");
      }).catch((err) => {
        ShowInformation(err.code);
        console.log("Error sending transaction: ", err);
      });
    }).catch((err) => {
      console.log("Error signing transaction: ", err);
    });
    
  }

  function ShowInformation(message) {
    var dvInformationMessage = document.getElementById('dvInformationMessage');
    dvInformationMessage.innerHTML = message;
    dvInformationMessage.style.display = 'block';
    setTimeout(HideInformation, 5000); // hide after 5 seconds
  }
  
  function HideInformation() {
    var dvInformationMessage = document.getElementById('dvInformationMessage');
    dvInformationMessage.style.display = 'none';
  }