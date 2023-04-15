import { ethers } from './ethers.min.js';

document.addEventListener('DOMContentLoaded', function() {
  var btnImportwallet = document.getElementById('btnImportwallet');
  btnImportwallet.addEventListener('click', function() {
    var seedPhrase = document.getElementById('importwalletAddress').value;
    importwallet(seedPhrase);
  });
});


function importwallet(seedPhrase) {
  // Do something with the seed phrase
  alert('Importing wallet with seed phrase: ' + seedPhrase);

  var provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');
 
  // Get all the wallet addresses
  provider.listAccounts().then(accounts => {
    console.log('Wallet addresses:', accounts);
  });
  //window.location.href = 'ListAccount.html';
}

