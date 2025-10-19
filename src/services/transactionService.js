import { Account } from '../models/account.js';
import { Mutex } from '../utils/mutex.js';

const dbMutex = new Mutex();

export async function withdraw(cardNo, amount) {
  await dbMutex.lock();
  try {
    const acc = await Account.findOne({ cardNo });
    if (!acc || acc.locked) return 'Account unavailable';
    if (acc.balance < amount) return 'Insufficient balance';

    acc.balance -= amount;
    console.log("Old balance:", acc.balance + amount, "New balance:", acc.balance);

    await acc.save();
    return 'Withdrawal successful';
  } finally {
    dbMutex.unlock();
  }
}

export async function deposit(cardNo, amount) {
  await dbMutex.lock();
  try {
    const acc = await Account.findOne({ cardNo });
    if (!acc) return 'Account not found';

    acc.balance += amount;
    await acc.save();
    return 'Deposit successful';
  } finally {
    dbMutex.unlock();
  }
}

export async function balanceInquiry(cardNo) {
  await dbMutex.lock();
  try {
    const acc = await Account.findOne({ cardNo });
    if (!acc) return 'Account not found';
    return `Balance: ${acc.balance}`;
  } finally {
    dbMutex.unlock();
  }
}
