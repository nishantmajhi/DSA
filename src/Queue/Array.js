class Queue {
  constructor(initialArray, maxSize = 100) {
    this.items = [];
    this.front = -1;
    this.rear = -1;
    this.maxSize = maxSize;

    if (initialArray instanceof Array) {
      if (initialArray.length > maxSize) {
        console.log("Initial array exceeds maximum queue size");
        return;
      }
      for (let i = 0; i < initialArray.length; i++) {
        this.enqueue(initialArray[i]);
      }
    }
  }

  enqueue(value) {
    if (this.isFull()) {
      console.log("Queue overflow");
      return;
    }

    if (this.isEmpty()) {
      this.front = 0;
      this.rear = 0;
    } else {
      this.rear++;
    }

    this.items[this.rear] = value;
  }

  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue underflow");
      return null;
    }

    const dequeuedValue = this.items[this.front];

    // if only one element was present
    if (this.front === this.rear) {
      this.front = -1;
      this.rear = -1;
    } else {
      this.front++;
    }

    return dequeuedValue;
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }

    return this.items[this.front];
  }

  isEmpty() {
    return this.front === -1;
  }

  isFull() {
    return this.rear === this.maxSize - 1;
  }

  size() {
    if (this.isEmpty()) {
      return 0;
    }
    return this.rear - this.front + 1;
  }

  search(value) {
    if (this.isEmpty()) {
      console.log(`${value} not found!`);
      return -1;
    }

    // search from front to rear
    for (let i = this.front; i <= this.rear; i++) {
      if (this.items[i] === value) {
        // return position from front (0-based)
        return i - this.front;
      }
    }

    console.log(`${value} not found!`);
    return -1;
  }

  traverse() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return;
    }

    // traverse from front to rear
    for (let i = this.front; i <= this.rear; i++) {
      console.log(this.items[i]);
    }
  }
}
