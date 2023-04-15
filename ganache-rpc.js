console.log(`hi`);



  function makeRequest()
  {
  const xhr = new XMLHttpRequest();
  console.log('makeRequest started');
  xhr.open('POST', 'http://localhost:7545');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function() {
    const data = JSON.parse(xhr.responseText);
    console.log(data.result);
    console.log('makeRequest completed');
  };

  xhr.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'web3_clientVersion',
    id: 1,
    params: []
  }));
}

function getBalance()
{
  console.log('getBalance Started');
  var textboxValue = document.getElementById("getBalanceAddress").value;
  const walletAddress =textboxValue;
  //const walletAddress = '0x5dc930B3bacA125f5C582b735e264b367283D73f'; // replace with the wallet address you want to check
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:7545'); // replace with your RPC endpoint URL
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const balance = response.result;
      const balanceInEther = parseFloat(parseInt(balance, 16) / Math.pow(10, 18)).toFixed(2);
      console.log(`Balance of ${walletAddress}: ${balanceInEther}`);
      console.log('getBalance completed without error');
    } else {
      console.log(`Error: ${xhr.status}`);
      console.log('getBalance completed with error');
    }
  }
};
xhr.send(JSON.stringify({
  jsonrpc: '2.0',
  method: 'eth_getBalance',
  params: [walletAddress, 'latest'],
  id: 1
}));
}

function transfer()
{
  console.log('transfer Started');
  var transferFrom = document.getElementById("transferFrom").value;
  var transferTo = document.getElementById("transferTo").value;
  const senderAddress = transferFrom;
  const recipientAddress = transferTo;
  
  const xhr = new XMLHttpRequest();
  const endpoint = 'http://localhost:7545'; // Ganache RPC endpoint
  const amountToSend = '100000000000000000'; // 0.1 ETH in wei
  
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
  

 async function importwallet() {
  
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');
    
    // Get all the wallet addresses
    provider.listAccounts().then(accounts => {
      console.log('Wallet addresses:', accounts);
    });
    
    const addressCount = 7;
  
    var importwallet = document.getElementById("importwalletAddress").value;
    const mnemonic = importwallet.trim();
    console.log(mnemonic);

    const rootNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    
    console.log('Wallet imported:');
    
    for (let i = 0; i < addressCount; i++) {
      const childNode = rootNode.derivePath(`m/44'/60'/0'/0/${i}`);
      
      const address = ethers.utils.getAddress(childNode.address);
        provider.getBalance(address).then(balance => {
          console.log(`Address ${i + 1}: ${address} | Balance: ${ethers.utils.formatEther(balance)}`);
        });

      }

    // Derive a new child node at index 5
    const childNode = rootNode.derivePath(`m/44'/60'/0'/0/5`);
    const newWallet = new ethers.Wallet(childNode.privateKey, provider);
    console.log('New wallet address:');
    console.log(`Address 6: ${newWallet.address}`);


}


async function createWallet() {
  
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');  
  const wallet = ethers.Wallet.createRandom();

  const mnemonic = wallet.mnemonic.phrase;

  console.log('New wallet created:');
  console.log(`Address: ${wallet.address}`);
  console.log(`Seed phrase: ${mnemonic}`);
}

function saveusernamepwd()
{
  console.log('New wallet address:');
  localStorage.setItem('myData', 'Hello, world!');
}