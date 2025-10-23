// REMOVE import for isSafeState
// import { isSafeState } from './bankerAlgorithm.js';

// Three ATMs and three resource types
const NUM_ATMS = 3;
const NUM_RESOURCES = 3;

// Allocation
let allocation = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];

let maxNeed = [
  [2, 1, 1],
  [1, 2, 1],
  [1, 1, 2],
];

let available = [4, 4, 4];

const waitingQueue = [];

function isValidAtmIdx(atmIdx) {
  return typeof atmIdx === 'number' && atmIdx >= 0 && atmIdx < NUM_ATMS;
}

function calculateNeed() {
  return maxNeed.map((maxRow, i) => 
    maxRow.map((maxVal, j) => maxVal - allocation[i][j])
  );
}

const attemptAllocate = (atmIdx, reqArr) => {
  if (!isValidAtmIdx(atmIdx)) {
    console.error('❌ Invalid atmIdx:', atmIdx);
    return { granted: false, reason: 'Invalid ATM index' };
  }

  console.log(`\n🔍 ATM ${atmIdx + 1} requesting resources:`, reqArr);
  console.log('📊 Current available:', available);
  console.log('📊 Current allocation:', allocation[atmIdx]);

  for (let j = 0; j < NUM_RESOURCES; j++) {
    if (reqArr[j] > available[j]) {
      console.log('❌ Request denied: Insufficient available resources');
      return { granted: false, reason: 'Insufficient available resources' };
    }
    if (reqArr[j] > (maxNeed[atmIdx][j] - allocation[atmIdx][j])) {
      console.log('❌ Request denied: Exceeds max claim');
      return { granted: false, reason: 'Request exceeds maximum need' };
    }
  }

  const tempAlloc = allocation.map(arr => [...arr]);
  const tempAvail = [...available];
  for (let j = 0; j < NUM_RESOURCES; j++) {
    tempAlloc[atmIdx][j] += reqArr[j];
    tempAvail[j] -= reqArr[j];
  }
  const tempNeed = maxNeed.map((maxRow, i) => 
    maxRow.map((maxVal, j) => maxVal - tempAlloc[i][j])
  );

  console.log('need matrix:', JSON.stringify(tempNeed));

  // Use locally defined isSafeState!
  const { isSafe, safeSeq } = isSafeState(tempAvail, tempAlloc, tempNeed);

  if (isSafe) {
    allocation = tempAlloc.map(arr => [...arr]);
    available = [...tempAvail];
    console.log('✅ Request granted! Safe sequence:', safeSeq.map(i => `ATM${i + 1}`).join(' → '));
    console.log('📊 New allocation:', allocation[atmIdx]);
    console.log('📊 New available:', available);
    return { granted: true, safeSeq };
  } else {
    console.log('❌ Request denied: Would lead to unsafe state');
    return { granted: false, reason: 'Unsafe state - potential deadlock' };
  }
};

const tryGrantWaitingRequests = () => {
  console.log(`\n🔄 Checking ${waitingQueue.length} waiting request(s)...`);
  let granted = 0;
  for (let i = 0; i < waitingQueue.length;) {
    const { atmIdx, reqArr, resolve } = waitingQueue[i];
    const result = attemptAllocate(atmIdx, reqArr);
    if (result.granted) {
      console.log(`✅ Granted waiting request for ATM ${atmIdx + 1}`);
      waitingQueue.splice(i, 1);
      resolve(result);
      granted++;
    } else {
      i++;
    }
  }
  if (granted === 0 && waitingQueue.length > 0) {
    console.log('⚠️ No waiting requests could be granted');
  }
};

export const requestResources = (atmIdx, reqArr) => {
  console.log(`\n📥 REQUEST from ATM ${atmIdx + 1}:`, reqArr);
  if (!isValidAtmIdx(atmIdx)) {
    console.error('❌ Invalid atmIdx:', atmIdx);
    return Promise.resolve({ granted: false, reason: 'Invalid ATM index' });
  }
  return new Promise((resolve) => {
    const result = attemptAllocate(atmIdx, reqArr);
    if (result.granted) {
      resolve(result);
    } else {
      console.log(`⏳ ATM ${atmIdx + 1} added to waiting queue`);
      waitingQueue.push({ atmIdx, reqArr, resolve });
    }
  });
};

export const releaseResources = (atmIdx, relArr) => {
  if (!isValidAtmIdx(atmIdx)) {
    console.error('❌ Invalid atmIdx on release:', atmIdx);
    return;
  }
  console.log(`\n📤 RELEASE from ATM ${atmIdx + 1}:`, relArr);
  for (let j = 0; j < NUM_RESOURCES; j++) {
    allocation[atmIdx][j] -= relArr[j];
    available[j] += relArr[j];
  }
  console.log('📊 Updated allocation:', allocation[atmIdx]);
  console.log('📊 Updated available:', available);
  if (waitingQueue.length > 0) {
    tryGrantWaitingRequests();
  }
};

export const debugResourceState = () => {
  console.log('\n═════════════════════════════');
  console.log('📊 RESOURCE STATE');
  console.log('═════════════════════════════');
  console.log('Available resources:', available);
  allocation.forEach((alloc, i) => {
    const need = maxNeed[i].map((max, j) => max - alloc[j]);
    console.log(`  ATM ${i + 1}: Allocated=${JSON.stringify(alloc)}, Need=${JSON.stringify(need)}, Max=${JSON.stringify(maxNeed[i])}`);
  });
  if (waitingQueue.length > 0) {
    console.log('\n⏳ Waiting queue:');
    waitingQueue.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ATM ${item.atmIdx + 1} waiting for ${JSON.stringify(item.reqArr)}`);
    });
  } else {
    console.log('\n✅ No requests waiting');
  }
  console.log('═════════════════════════════\n');
};

// Only ONE definition of isSafeState here
export function isSafeState(available, allocation, need) {
  const n = allocation.length;
  const m = available.length;
  const work = [...available];
  const finish = Array(n).fill(false);
  const safeSeq = [];
  for (let count = 0; count < n; count++) {
    let found = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        let canFinish = true;
        for (let j = 0; j < m; j++) {
          if (need[i][j] > work[j]) {
            canFinish = false;
            break;
          }
        }
        if (canFinish) {
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          safeSeq.push(i);
          finish[i] = true;
          found = true;
        }
      }
    }
    if (!found) {
      return { isSafe: false, safeSeq: [] };
    }
  }
  return { isSafe: true, safeSeq };
}
