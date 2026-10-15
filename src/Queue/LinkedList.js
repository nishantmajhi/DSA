class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class Queue {
  constructor(initialArray) {
    this.front = null;
    this.rear = null;
    this.size = 0;

    if (initialArray instanceof Array) {
      for (let i = 0; i < initialArray.length; i++) {
        this.enqueue(initialArray[i]);
      }
    }
  }

  enqueue(value) {
    const newNode = new Node(value);

    if (this.isEmpty()) {
      // if queue is empty, both front and rear point to new node
      this.front = newNode;
      this.rear = newNode;
    } else {
      // add new node at the rear
      this.rear.next = newNode;
      this.rear = newNode;
    }

    this.size++;
  }

  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue underflow");
      return null;
    }

    const dequeuedValue = this.front.value;

    // move front pointer to the next node
    this.front = this.front.next;

    // if queue becomes empty after dequeue
    if (this.front === null) {
      this.rear = null;
    }

    this.size--;
    return dequeuedValue;
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }

    return this.front.value;
  }

  isEmpty() {
    return this.front === null;
  }

  isFull() {
    // For linked list implementation, queue is never full (until memory runs out)
    return false;
  }

  getSize() {
    return this.size;
  }

  search(value) {
    if (this.isEmpty()) {
      console.log(`${value} not found!`);
      return -1;
    }

    let current = this.front;
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
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return;
    }

    let current = this.front;

    while (current !== null) {
      console.log(current.value);
      current = current.next;
    }
  }
}
