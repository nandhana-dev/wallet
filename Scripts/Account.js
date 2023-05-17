export class Account {
    constructor(accountName, address,privateKey) {
      this.accountName = accountName;
      this.address = address;
      this.privateKey=privateKey;
    }
  }

  export class AccountArray {
    constructor() {
      this.accounts = [];
    }
  
    addAccount(accountName, address,privateKey) {
      const account = new Account(accountName, address,privateKey);
      this.accounts.push(account);
    }
  
    getAccount(index) {
      return this.accounts[index];
    }
  
    getAllAccounts() {
      return this.accounts;
    }
  }
  
  