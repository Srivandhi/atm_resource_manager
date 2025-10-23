import { Account } from '../models/account.js';
import { Mutex } from '../utils/mutex.js';

const dbMutex = new Mutex();

export async function withdraw(cardNo, amount) {
  console.log("Trying to withdraw:", amount, "from card:", cardNo);
  await dbMutex.lock();
  try {
    const acc = await Account.findOne({ cardNo });
    console.log("Found account:", acc);
    if (!acc || acc.locked) {
      console.log('Account unavailable');
      return 'Account unavailable';
    }
    if (acc.balance < amount) {
      console.log('Insufficient balance');
      return 'Insufficient balance';
    }

    const oldBalance = acc.balance;
    acc.balance -= amount;
    await acc.save();

    console.log("Old balance:", oldBalance, "New balance:", acc.balance);
    return 'Withdrawal successful';
  } finally {
    dbMutex.unlock();
  }
}

export async function deposit(cardNo, amount) {
  console.log("Trying to deposit:", amount, "to card:", cardNo);
  await dbMutex.lock();
  try {
    const acc = await Account.findOne({ cardNo });
    if (!acc || acc.locked) {
      console.log('Account unavailable');
      return 'Account unavailable';
    }

    const oldBalance = acc.balance;
    acc.balance += amount;
    await acc.save();

    console.log("Old balance:", oldBalance, "New balance:", acc.balance);
    return 'Deposit successful';
  } finally {
    dbMutex.unlock();
  }
}

export async function balanceInquiry(cardNo) {
  console.log("Balance inquiry for card:", cardNo);
  await dbMutex.lock();
  try {
    const acc = await Account.findOne({ cardNo });
    if (!acc || acc.locked) {
      console.log('Account unavailable');
      return 'Account unavailable';
    }

    console.log("Balance:", acc.balance);
    return `Balance: ${acc.balance}`;
  } finally {
    dbMutex.unlock();
  }
}
