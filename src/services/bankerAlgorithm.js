// Simple in-memory banker scenario for 3 ATMs, 3 resources, extend as needed

export const isSafeState = (available, allocation, need) => {
  const work = [...available];
  const finish = Array(allocation.length).fill(false);
  let safeSeq = [];

  for (let count = 0; count < allocation.length; ) {
    let found = false;
    for (let i = 0; i < allocation.length; i++) {
      if (!finish[i]) {
        const canAllocate = need[i].every((n, j) => n <= work[j]);
        if (canAllocate) {
          for (let j = 0; j < work.length; j++) work[j] += allocation[i][j];
          safeSeq.push(i);
          finish[i] = true;
          found = true;
          count++;
        }
      }
    }
    if (!found) break;
  }

  return { isSafe: finish.every(f => f), safeSeq };
};
