export class Account {
    constructor(accountName, address) {
      this.accountName = accountName;
      this.address = address;
    }
  }

  export class AccountArray {
    constructor() {
      this.accounts = [];
    }
  
    addAccount(accountName, address) {
      const account = new Account(accountName, address);
      this.accounts.push(account);
    }
  
    getAccount(index) {
      return this.accounts[index];
    }
  
    getAllAccounts() {
      return this.accounts;
    }
  }
  
  