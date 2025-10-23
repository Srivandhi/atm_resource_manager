import { isSafeState } from './bankerAlgorithm.js';

// Configuration for 3 ATMs and 3 resource types
const NUM_ATMS = 3;
const NUM_RESOURCES = 3;

// Current allocation: how many resources each ATM currently holds
let allocation = [
  [0, 0, 0], // ATM 0 (ATM ID 1)
  [0, 0, 0], // ATM 1 (ATM ID 2)
  [0, 0, 0], // ATM 2 (ATM ID 3)
];

// Maximum resources each ATM might need during operation
let maxNeed = [
  [2, 1, 1], // ATM 0 max needs
  [1, 2, 1], // ATM 1 max needs
  [1, 1, 2], // ATM 2 max needs
];

// Available resources in the system
let available = [4, 4, 4]; // Increased for better availability

// Queue for waiting requests
const waitingQueue = [];

// Helper: Validate ATM index
function isValidAtmIdx(atmIdx) {
  return typeof atmIdx === 'number' && atmIdx >= 0 && atmIdx < NUM_ATMS;
}

// Helper: Calculate remaining need for all ATMs
function calculateNeed() {
  return maxNeed.map((maxRow, i) => 
    maxRow.map((maxVal, j) => maxVal - allocation[i][j])
  );
}

// Helper: Check if request can be satisfied
function canSatisfyRequest(atmIdx, reqArr, currentAvailable) {
  // Check if enough resources available
  for (let j = 0; j < NUM_RESOURCES; j++) {
    if (reqArr[j] > currentAvailable[j]) {
      return { can: false, reason: 'Insufficient available resources' };
    }
  }

  // Check if request exceeds remaining need
  const need = calculateNeed();
  for (let j = 0; j < NUM_RESOURCES; j++) {
    if (reqArr[j] > need[atmIdx][j]) {
      return { can: false, reason: 'Request exceeds maximum need' };
    }
  }

  return { can: true };
}

// Attempt to allocate resources to an ATM
const attemptAllocate = (atmIdx, reqArr) => {
  if (!isValidAtmIdx(atmIdx)) {
    console.error('❌ Invalid atmIdx:', atmIdx);
    return { granted: false, reason: 'Invalid ATM index' };
  }

  console.log(`\n🔍 ATM ${atmIdx + 1} requesting resources:`, reqArr);
  console.log('📊 Current available:', available);
  console.log('📊 Current allocation:', allocation[atmIdx]);

  // Check if request can be satisfied
  const check = canSatisfyRequest(atmIdx, reqArr, available);
  if (!check.can) {
    console.log('❌ Request denied:', check.reason);
    return { granted: false, reason: check.reason };
  }

  // Simulate allocation
  const tempAlloc = allocation.map(arr => [...arr]);
  const tempAvail = [...available];

  for (let j = 0; j < NUM_RESOURCES; j++) {
    tempAlloc[atmIdx][j] += reqArr[j];
    tempAvail[j] -= reqArr[j];
  }

  // Calculate need for safety check
  const need = maxNeed.map((maxRow, i) => 
    maxRow.map((maxVal, j) => maxVal - tempAlloc[i][j])
  );

  // Run Banker's Algorithm safety check
  const { isSafe, safeSeq } = isSafeState(tempAvail, tempAlloc, need);

  if (isSafe) {
    // Grant the request
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

// Try to grant waiting requests
const tryGrantWaitingRequests = () => {
  console.log(`\n🔄 Checking ${waitingQueue.length} waiting request(s)...`);
  
  let granted = 0;
  for (let i = 0; i < waitingQueue.length; ) {
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
    console.log('⚠️  No waiting requests could be granted');
  }
};

// Public API: Request resources
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

// Public API: Release resources
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

  // Try to grant waiting requests
  if (waitingQueue.length > 0) {
    tryGrantWaitingRequests();
  }
};

// Public API: Debug current state
export const debugResourceState = () => {
  console.log('\n═══════════════════════════════════════');
  console.log('📊 RESOURCE STATE');
  console.log('═══════════════════════════════════════');
  console.log('Available resources:', available);
  console.log('\nATM Allocations:');
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
  console.log('═══════════════════════════════════════\n');
};

// Reset function for testing
export const resetResourceManager = () => {
  allocation = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  available = [3, 3, 3];
  waitingQueue.length = 0;
  console.log('🔄 Resource manager reset');
};