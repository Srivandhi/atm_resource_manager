import { isSafeState } from './bankerAlgorithm.js';

// In-memory tracking for 3 ATMs, 3 resources (demo setup)
let allocation = [
  [0, 0, 0], // ATM 0
  [0, 0, 0], // ATM 1
  [0, 0, 0], // ATM 2
];

// Demo max needs for ATMs
let maxNeed = [
  [1, 1, 1],
  [1, 0, 1],
  [0, 1, 1],
];

// For more permissive testing, you can increase resources:
let available = [2, 2, 2]; // Start with 2 of each resource for smooth demo

const waitingQueue = [];

function isValidAtmIdx(atmIdx) {
  return typeof atmIdx === 'number' && atmIdx >= 0 && atmIdx < allocation.length;
}

// Grant queued requests if possible
const tryGrantWaitingRequests = () => {
  for (let i = 0; i < waitingQueue.length; ) {
    const { atmIdx, reqArr, resolve } = waitingQueue[i];
    const result = attemptAllocate(atmIdx, reqArr);
    if (result.granted) {
      console.log('Granting waiting request for ATM', atmIdx);
      waitingQueue.splice(i, 1);
      resolve(result);
    } else {
      i++;
    }
  }
};

const attemptAllocate = (atmIdx, reqArr) => {
  if (!isValidAtmIdx(atmIdx)) {
    console.error('Invalid atmIdx:', atmIdx);
    return { granted: false, reason: 'Invalid ATM index' };
  }

  // Calculate remaining need per ATM
  const need = maxNeed.map((m, i) => m.map((v, j) => v - allocation[i][j]));

  if (!need[atmIdx] || need[atmIdx].length !== reqArr.length) {
    console.error('Invalid need array at atmIdx:', atmIdx, need);
    return { granted: false, reason: "Internal error: need array mismatch" };
  }

  // Check requested resources do not exceed needed
  if (reqArr.some((v, j) => v > need[atmIdx][j])) {
    return { granted: false, reason: 'Exceeds max claim' };
  }

  // Check requested resources do not exceed available
  if (reqArr.some((v, j) => v > available[j])) {
    return { granted: false, reason: 'Not enough resources' };
  }

  // Simulate allocation and resource availability
  const tempAlloc = allocation.map(arr => [...arr]);
  const tempAvail = [...available];

  for (let j = 0; j < reqArr.length; j++) {
    tempAlloc[atmIdx][j] += reqArr[j];
    tempAvail[j] -= reqArr[j];
  }

  // Use Banker Algorithm's safety check on simulated data
  const { isSafe, safeSeq } = isSafeState(tempAvail, tempAlloc, need);

  if (isSafe) {
    allocation = tempAlloc.map(arr => [...arr]); // deep clone
    available = [...tempAvail];
    console.log('Granting request, new allocation:', allocation);
    console.log('New available:', available);
    return { granted: true, safeSeq };
  }
  return { granted: false, reason: 'Unsafe state' };
};

export const requestResources = (atmIdx, reqArr) => {
  console.log('requestResources called with atmIdx:', atmIdx, 'reqArr:', reqArr);
  if (!isValidAtmIdx(atmIdx)) {
    console.error('Invalid atmIdx on requestResources:', atmIdx);
    return Promise.resolve({ granted: false, reason: 'Invalid ATM index' });
  }
  return new Promise((resolve) => {
    const result = attemptAllocate(atmIdx, reqArr);
    if (result.granted) {
      resolve(result);
    } else {
      waitingQueue.push({ atmIdx, reqArr, resolve });
      debugResourceState(); // Show blocked state immediately
    }
  });
};

export const releaseResources = (atmIdx, relArr) => {
  if (!isValidAtmIdx(atmIdx)) {
    console.error('Invalid atmIdx on releaseResources:', atmIdx);
    return;
  }
  for (let j = 0; j < relArr.length; j++) {
    allocation[atmIdx][j] -= relArr[j];
    available[j] += relArr[j];
  }
  tryGrantWaitingRequests();
};

export const debugResourceState = () => {
  console.log('Allocation:', allocation);
  console.log('Available:', available);
  console.log('Waiting:', waitingQueue.map(q => q.atmIdx));
};
