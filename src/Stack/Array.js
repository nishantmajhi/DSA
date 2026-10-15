class Stack {
  constructor(initialArray, maxSize = 100) {
    this.items = [];
    this.top = -1;
    this.maxSize = maxSize;

    if (initialArray instanceof Array) {
      if (initialArray.length > maxSize) {
        console.log("Initial array exceeds maximum stack size");
        return;
      }
      for (let i = 0; i < initialArray.length; i++) {
        this.push(initialArray[i]);
      }
    }
  }

  push(value) {
    if (this.isFull()) {
      console.log("Stack overflow");
      return;
    }

    // increment top index and insert element
    this.top++;
    this.items[this.top] = value;
  }

  pop() {
    if (this.isEmpty()) {
      console.log("Stack underflow");
      return null;
    }

    const poppedValue = this.items[this.top];
    // decrement top index to remove element
    this.top--;

    return poppedValue;
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Stack is empty");
      return null;
    }

    return this.items[this.top];
  }

  isEmpty() {
    return this.top === -1;
  }

  isFull() {
    return this.top === this.maxSize - 1;
  }

  size() {
    return this.top + 1;
  }

  search(value) {
    // search from top to bottom
    for (let i = this.top; i >= 0; i--) {
      if (this.items[i] === value) {
        // return position from top (0-based)
        return this.top - i;
      }
    }

    console.log(`${value} not found!`);
    return -1;
  }

  traverse() {
    // traverse from top to bottom
    for (let i = this.top; i >= 0; i--) {
      console.log(this.items[i]);
    }
  }
}
