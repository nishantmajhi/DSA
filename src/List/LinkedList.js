class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor(initialArray) {
    this.head = null;
    this.size = 0;

    if (initialArray instanceof Array) {
      for (let i = 0; i < initialArray.length; i++) {
        this.insert(initialArray[i]);
      }
    }
  }

  insert(value, index = this.size) {
    if (index < 0 || index > this.size) {
      console.log("Invalid index");
      return;
    }

    const newNode = new Node(value);

    if (index == 0) {
      // shift head to the right by pointing new node to current head
      newNode.next = this.head;
      // insert new node at the beginning
      this.head = newNode;
      this.size++;
    } else if (index < this.size) {
      // traverse to the node before the insertion point
      let current = this.head;
      for (let i = 0; i < index - 1; i++) {
        current = current.next;
      }
      // shift the next pointer to the right
      newNode.next = current.next;
      // insert new node at the specified index
      current.next = newNode;
      this.size++;
    } else {
      // traverse to the last node
      let current = this.head;
      for (let i = 0; i < this.size - 1; i++) {
        current = current.next;
      }
      // insert new node at the end
      current.next = newNode;
      this.size++;
    }
  }

  indexOutOfBound(index) {
    return index < 0 || index >= this.size;
  }

  remove(index) {
    if (this.indexOutOfBound(index)) {
      console.log("Invalid index");
      return;
    }

    if (index == 0) {
      // shift head to the left by pointing it to the next node
      this.head = this.head.next;
      this.size--;
    } else {
      // traverse to the node before the one to be removed
      let current = this.head;
      for (let i = 0; i < index - 1; i++) {
        current = current.next;
      }
      // shift the next pointer to skip the removed node
      current.next = current.next.next;
      this.size--;
    }
  }

  get(index) {
    if (this.indexOutOfBound(index)) {
      console.log("Invalid index");
      return null;
    }

    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current.next;
    }

    return current.value;
  }

  update(newValue, index) {
    if (this.indexOutOfBound(index)) {
      console.log("Invalid index");
      return;
    }

    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current.next;
    }

    current.value = newValue;
  }

  search(value) {
    let current = this.head;
    for (let i = 0; i < this.size; i++) {
      if (current.value === value) {
        return i;
      }
      current = current.next;
    }
    console.log(`${value} not found!`);
    return -1;
  }

  traverse() {
    let current = this.head;
    for (let i = 0; i < this.size; i++) {
      console.log(current.value);
      current = current.next;
    }
  }

  reverse() {
    let prev = null;
    let current = this.head;
    let next = null;

    // move until the tail node is crossed
    while (current != null) {
      next = current.next; // find next node
      current.next = prev; // shift pointer backward
      prev = current; // move prev forward
      current = next; // move current forward
    }

    this.head = prev; // last node becomes first
  }
}
