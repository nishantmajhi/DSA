class HeapNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = null;
  }
}

class MinHeap {
  constructor(initialArray) {
    this.root = null;
    this.size = 0;

    if (initialArray instanceof Array) {
      for (let i = 0; i < initialArray.length; i++) {
        this.insert(initialArray[i]);
      }
    }
  }

  // navigate to node at given index using binary path
  getNodeAt(index) {
    if (index === 0) return this.root;

    // convert index to binary, skip the leading 1 bit to get the path
    const path = index.toString(2).slice(1);
    let current = this.root;

    for (const bit of path) {
      current = bit === "0" ? current.left : current.right;
    }

    return current;
  }

  swap(a, b) {
    let temp = a.value;
    a.value = b.value;
    b.value = temp;
  }

  insert(value) {
    const newNode = new HeapNode(value);

    if (this.root === null) {
      this.root = newNode;
      this.size++;
      return;
    }

    // find the parent of the next available position
    const parentIndex = Math.floor((this.size - 1) / 2);
    const parent = this.getNodeAt(parentIndex);

    newNode.parent = parent;

    if (parent.left === null) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    this.size++;
    // bubble up to restore heap property
    this.heapifyUp(newNode);
  }

  heapifyUp(node) {
    while (node.parent !== null && node.parent.value > node.value) {
      // swap with parent if parent is larger
      this.swap(node, node.parent);
      node = node.parent;
    }
  }

  extractMin() {
    if (this.isEmpty()) {
      console.log("Heap is empty");
      return null;
    }

    const min = this.root.value;

    if (this.size === 1) {
      this.root = null;
      this.size--;
      return min;
    }

    // copy last node's value to root then detach the last node
    const lastNode = this.getNodeAt(this.size - 1);
    this.root.value = lastNode.value;

    if (lastNode.parent.right === lastNode) {
      lastNode.parent.right = null;
    } else {
      lastNode.parent.left = null;
    }

    this.size--;
    // bubble down to restore heap property
    this.heapifyDown(this.root);

    return min;
  }

  heapifyDown(node) {
    while (node.left !== null) {
      let smallest = node.left;

      if (node.right !== null && node.right.value < node.left.value) {
        smallest = node.right;
      }

      if (node.value > smallest.value) {
        // swap with smallest child if node is larger
        this.swap(node, smallest);
        node = smallest;
      } else {
        break;
      }
    }
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Heap is empty");
      return null;
    }
    return this.root.value;
  }

  isEmpty() {
    return this.root === null;
  }

  search(value) {
    // BFS through all nodes
    if (this.isEmpty()) {
      console.log(value + " not found!");
      return -1;
    }

    const queue = [this.root];
    let index = 0;

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.value === value) {
        return index;
      }

      if (current.left) queue.push(current.left);
      if (current.right) queue.push(current.right);

      index++;
    }

    console.log(value + " not found!");
    return -1;
  }

  traverse() {
    // level-order traversal
    if (this.isEmpty()) return;

    const queue = [this.root];

    while (queue.length > 0) {
      const current = queue.shift();
      console.log(current.value);

      if (current.left) queue.push(current.left);
      if (current.right) queue.push(current.right);
    }
  }
}
