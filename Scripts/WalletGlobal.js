const WalletGlobal = {
  WalletNetworkEndpoint: 'http://localhost:7545',
  WalletSeedPhrase: localStorage.getItem('SeedPhrase'),
  WalletPassword: localStorage.getItem('EncryptedwalletPassword'),
  WalletAccounts: localStorage.getItem('Accounts')
};

//WalletNetworkEndpoint: 'https://rpc-sepolia.rockx.com'
//WalletNetworkEndpoint: 'http://localhost:7545',
export { WalletGlobal };
