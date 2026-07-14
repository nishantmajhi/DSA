class List {
  constructor(initialArray) {
    this.data = [];
    this.size = 0;

    if (initialArray instanceof Array) {
      const length = initialArray.length;
      
      for (let i = 0; i < length; i++) {
        this.insert(initialArray[i]);
      }

      this.size = length;
    }
  }

  insert(value, index = this.size) {
    if (index < 0 || index > this.size) {
      console.log("Invalid index");
      return;
    } else if (index == 0) {
      // shift all elements one step to the right
      for (let i = this.size; i > 0; i--) {
        this.data[i] = this.data[i - 1];
      }
      // insert value at the beginning
      this.data[0] = value;
      this.size++;
    } else if (index < this.size) {
      // shift elements from index onwards one step to the right
      for (let i = this.size; i > index; i--) {
        this.data[i] = this.data[i - 1];
      }
      // insert value at the specified index
      this.data[index] = value;
      this.size++;
    } else {
      // insert value at the end
      this.data[this.size] = value;
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

    // shift elements left to overwrite the removed element
    for (let i = index; i < this.size - 1; i++) {
      this.data[i] = this.data[i + 1];
    }

    this.size--;
    this.data.length = this.size;
  }

  get(index) {
    if (this.indexOutOfBound(index)) {
      console.log("Invalid index");
      return null;
    }

    return this.data[index];
  }

  update(newValue, index) {
    if (this.indexOutOfBound(index)) {
      console.log("Invalid index");
      return;
    }

    this.data[index] = newValue;
  }

  search(value) {
    for (let i = 0; i < this.size; i++) {
      if (this.data[i] === value) {
        return i;
      }
    }
    console.log(`${value} not found!`);
    return -1;
  }

  traverse() {
    for (let i = 0; i < this.size; i++) {
      console.log(this.data[i]);
    }
  }

  reverse() {
    let left = 0;
    let right = this.size - 1;

    // shift elements from both ends toward the center
    while (left < right) {
      // swap elements at left and right indices
      let temp = this.data[left];
      this.data[left] = this.data[right];
      this.data[right] = temp;

      // move pointers inward
      left++;
      right--;
    }
  }
}
