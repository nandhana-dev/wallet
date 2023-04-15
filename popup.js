import { ethers } from './ethers.min.js';
import { AccountArray } from './Account.js';

const seedPhrase = localStorage.getItem("SeedPhrase");

if (!seedPhrase || seedPhrase === "null") {
  chrome.tabs.create({url: 'OnBoard.html'});
} 
//chrome.tabs.create({url: 'OnBoard.html'});

const dropdown = document.getElementById("myDropdown");
const ethBalance = document.getElementById("ethBalance");
const accountAddress = document.getElementById("accountAddress");

const txtAccountName = document.getElementById("txtAccountName");
const dvChangeAccoutName = document.getElementById("dvChangeAccoutName");
const dvSendETH = document.getElementById("dvSendETH");


document.addEventListener('DOMContentLoaded', function() {

    var btnExpandView = document.getElementById('btnExpandView');
    btnExpandView.addEventListener('click', function() {
      ExpandView();
    });

    var btnChangeAccountName = document.getElementById('btnChangeAccountName');
    btnChangeAccountName.addEventListener('click', function() {
      ChangeAccountName();
    });

    var btnAddNewAccount = document.getElementById('btnAddNewAccount');
    btnAddNewAccount.addEventListener('click', function() {
      AddNew();
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
    
    var dropdown = document.getElementById('myDropdown');
    dropdown.addEventListener('change', function() {
      GetBalance();
    });
   
    LoadAccountFromLocalStroage();
    
});

function ExpandView()
{
  chrome.tabs.create({url: 'Wallet.html'});
}

function CreateAccount()
{
      const mnemonic = seedPhrase;
      //const mnemonic = "lazy nut drip tent subject brush hold distance help rich slam pizza";
      console.log(mnemonic);
      const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
      console.log('Wallet imported:');
      const addressCount = 1;
      const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');
      
      const options = [];
      const defaultAccountName='Account 1'
      const accountArray = new AccountArray();
      
      const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${0}`);
      const address = ethers.utils.getAddress(childNode.address);

      provider.getBalance(address).then(balance =>
      {
      options.push({ label: address, value: address });
      const optionElement = document.createElement("option");
      optionElement.value = address;
      optionElement.text =  defaultAccountName;
      dropdown.appendChild(optionElement);
      });

      accountArray.addAccount(defaultAccountName, address);
      accountArray.addAccount(defaultAccountName+"2", address+"2");

      const jsonString = JSON.stringify(accountArray);
      localStorage.setItem('Accounts', jsonString);

}


function LoadAccountFromLocalStroage()
{
  dropdown.options.length = 0;

  var obj = JSON.parse(localStorage.getItem("Accounts"));
  var accounts = null;

  if (obj === null) {
    CreateNew(0);
    obj = JSON.parse(localStorage.getItem("Accounts"));
    accounts = obj.accounts;
  }
  else 
  {
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
    dropdown.appendChild(option);
  });

  GetBalance();
}

function CreateNew(index)
{
    const mnemonic = seedPhrase;
    const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');
    const options = [];
    const defaultAccountName='Account '+ (index+1);
    const accountArray = new AccountArray();
    
    const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${index}`);
    const address = ethers.utils.getAddress(childNode.address);

    accountArray.addAccount(defaultAccountName, address);

    const jsonString = JSON.stringify(accountArray);
    localStorage.setItem('Accounts', jsonString);
    
}

function AddNew()
{
  dropdown.options.length = 0;

  var obj = JSON.parse(localStorage.getItem("Accounts"));
  var accounts = null;
  accounts = obj.accounts;
  var index = accounts.length;
  
  const mnemonic = seedPhrase;
  const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');
  const options = [];
  const defaultAccountName='Account '+ (index+1);
  const accountArray = new AccountArray();
  
  const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${index}`);
  const address = ethers.utils.getAddress(childNode.address);
  
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.text = account.accountName;
    option.value = account.address;
    dropdown.appendChild(option);
    accountArray.addAccount(account.accountName, account.address);
  });

  const option1 = document.createElement('option');
  option1.text = defaultAccountName;
  option1.value = address;
  dropdown.appendChild(option1);
  accountArray.addAccount(defaultAccountName, address);
  
  const jsonString = JSON.stringify(accountArray);
  localStorage.setItem('Accounts', jsonString);
  
  GetBalance();
}

function ChangeAccountName()
{
  if (dvChangeAccoutName.style.display === "none") {
    dvChangeAccoutName.style.display = "block";
  } else {
    dvChangeAccoutName.style.display = "none";
  }
  var selectedText = dropdown.options[dropdown.selectedIndex].text;
  txtAccountName.value = selectedText;
 }


 
function SendETH()
{
  if (dvSendETH.style.display === "none") {
    dvSendETH.style.display = "block";
  } else {
    dvSendETH.style.display = "none";
  }
}

function SaveAccountName()
{
 
  const obj = JSON.parse(localStorage.getItem("Accounts"));
  const accountToUpdate = obj.accounts.find(account => account.address === dropdown.value);

  if (accountToUpdate) {
    accountToUpdate.accountName = txtAccountName.value ;
    console.log("Account updated:", accountToUpdate);
  } else {
    console.log("Account not found.");
  }

  const jsonString = JSON.stringify(obj);
  
  localStorage.setItem('Accounts', jsonString);

  dropdown.options.length = 0;

  obj.accounts.forEach(account => {
    const option = document.createElement('option');
    option.text = account.accountName;
    option.value = account.address;
    dropdown.appendChild(option);
  });

  GetBalance();
  dvChangeAccoutName.style.display = "none";

  //LoadAccountFromLocalStroage();

}


function GetBalance()
{
  console.log('getBalance Started');
  const checkBalanceAddress = dropdown.value;
  
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:7545');
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
    params: [checkBalanceAddress, 'latest'],
    id: 1
  }));
}


function TranferToAccount()
{
    console.log('transfer Started');
    //var transferFrom = document.getElementById("transferFrom").value;
    const senderAddress = dropdown.value;

    var sendAddress = document.getElementById("sendAddress").value;
    //const senderAddress = transferFrom;
    const recipientAddress = sendAddress;
    
    var ethAmount = document.getElementById("enterValue").value;
    var weiAmount = ethAmount * 10**18;
    const amountToSend = weiAmount;
    
    const xhr = new XMLHttpRequest();
    const endpoint = 'http://localhost:7545'; // Ganache RPC endpoint
    //const amountToSend = '100000000000000000'; // 0.1 ETH in wei
      const txParams = {
      from: senderAddress,
      to: recipientAddress,
      value: '0x' + parseInt(amountToSend).toString(16)
    };
    
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        console.log(`Transaction hash: ${response.result}`);
      } else {
        console.error('Failed to send transaction');
      }
    };
    xhr.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendTransaction', params: [txParams] }));
  }