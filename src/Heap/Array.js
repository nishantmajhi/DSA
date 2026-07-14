class MinHeap {
  constructor(initialArray) {
    this.items = [];
    this.size = 0;

    if (initialArray instanceof Array) {
      for (let i = 0; i < initialArray.length; i++) {
        this.insert(initialArray[i]);
      }
    }
  }

  parentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  leftChildIndex(i) {
    return 2 * i + 1;
  }

  rightChildIndex(i) {
    return 2 * i + 2;
  }

  swap(i, j) {
    let temp = this.items[i];
    this.items[i] = this.items[j];
    this.items[j] = temp;
  }

  insert(value) {
    // add value at the end
    this.items[this.size] = value;
    this.size++;
    // bubble up to restore heap property
    this.heapifyUp(this.size - 1);
  }

  heapifyUp(index) {
    while (index > 0) {
      const parent = this.parentIndex(index);
      if (this.items[parent] > this.items[index]) {
        // swap with parent if parent is larger
        this.swap(parent, index);
        index = parent;
      } else {
        break;
      }
    }
  }

  extractMin() {
    if (this.isEmpty()) {
      console.log("Heap is empty");
      return null;
    }

    const min = this.items[0];
    // move last element to root
    this.items[0] = this.items[this.size - 1];
    this.size--;
    this.items.length = this.size;
    // bubble down to restore heap property
    this.heapifyDown(0);

    return min;
  }

  heapifyDown(index) {
    while (true) {
      let smallest = index;
      const left = this.leftChildIndex(index);
      const right = this.rightChildIndex(index);

      if (left < this.size && this.items[left] < this.items[smallest]) {
        smallest = left;
      }
      if (right < this.size && this.items[right] < this.items[smallest]) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
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
    return this.items[0];
  }

  isEmpty() {
    return this.size === 0;
  }

  search(value) {
    for (let i = 0; i < this.size; i++) {
      if (this.items[i] === value) {
        return i;
      }
    }
    console.log(value + " not found!");
    return -1;
  }

  traverse() {
    for (let i = 0; i < this.size; i++) {
      console.log(this.items[i]);
    }
  }
}
