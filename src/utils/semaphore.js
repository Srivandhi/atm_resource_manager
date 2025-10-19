export class Semaphore {
  constructor(count) {
    this.count = count;
    this.queue = [];
  }

  async acquire() {
    if (this.count > 0) {
      this.count--;
      return Promise.resolve();
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.count++;
    }
  }
}
