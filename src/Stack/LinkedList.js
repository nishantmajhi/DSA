class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class Stack {
  constructor(initialArray) {
    this.top = null;
    this.size = 0;

    if (initialArray instanceof Array) {
      for (let i = 0; i < initialArray.length; i++) {
        this.push(initialArray[i]);
      }
    }
  }

  push(value) {
    const newNode = new Node(value);

    // point new node to current top
    newNode.next = this.top;
    // make new node the new top
    this.top = newNode;
    this.size++;
  }

  pop() {
    if (this.isEmpty()) {
      console.log("Stack underflow");
      return null;
    }

    const poppedValue = this.top.value;
    // move top pointer to the next node
    this.top = this.top.next;
    this.size--;

    return poppedValue;
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Stack is empty");
      return null;
    }

    return this.top.value;
  }

  isEmpty() {
    return this.top === null;
  }

  isFull() {
    // For linked list implementation, stack is never full (until memory runs out)
    return false;
  }

  search(value) {
    let current = this.top;
    let position = 0;

    while (current !== null) {
      if (current.value === value) {
        return position;
      }
      current = current.next;
      position++;
    }

    console.log(`${value} not found!`);
    return -1;
  }

  traverse() {
    let current = this.top;
    
    while (current !== null) {
      console.log(current.value);
      current = current.next;
    }
  }
}