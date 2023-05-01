function about(){
  // Connect to Ganache network
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');

  // Smart contract address and ABI
  //const contractAddress = '0x4a807b73e623aa166e3F28f8C11cF0473e4F7beb'; 
  const contractAddress='0x2bDDd9A51EB147638A99570b944c94121b04075d';
  const contractABI = [
    {
      "inputs": [],
      "name": "information_",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "store_it",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

  // Create contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  async function retrieveData() {
    console.log("Async function initated...");
    try {
        // Call the contract function to retrieve data
        const result = await contract.store_it();
        // Update the HTML output with the retrieved data
        document.getElementById('output').innerText = 'Wallet for Everyone ..' + result;
    } catch (error) {
        console.error(error);
    }
  }
  retrieveData();
}

    var button = document.getElementById('createNewWallet');
    button.addEventListener('click', function() {
      console.log("ShowSeedPhrase");
      window.location.href = '../Page/ShowSeedPhrase.html';
    });
    
    var importExistingWallet = document.getElementById('importExistingWallet');
    importExistingWallet.addEventListener('click', function() {
        console.log("ImportWallet");
        window.location.href = '../Page/ImportWallet.html';
    });

    var aboutwallet = document.getElementById('aboutwallet');
    aboutwallet.addEventListener('click',about);
