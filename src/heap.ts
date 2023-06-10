export interface HeapNode {
  elem: number
  data: any
  child?: HeapNode | null
  next?: HeapNode | null
}

const newHeapNode = (elem: number, data:any): HeapNode => ({
  elem: elem,
  data: data,
  child: null,
  next: null
})

export class Heap {
  root: any
  len: number
  constructor() {
    this.root = null
    this.len = 0
  }

  popMax() {
    if (!this.len) {
      return null
    }
    const max = this.root
    this.len -= 1
    this.root = this.mergePairs(this.root.child)
    return max
  }

  insert(elem:number, data:any) {
    this.root = this.merge(this.root, newHeapNode(elem, data))
    return ++this.len
  }

  link(parent:HeapNode, child:HeapNode) {
    const firstChild = parent.child
    parent.child = child
    child.next = firstChild
  }

  merge(heap1?: HeapNode | null, heap2?: HeapNode | null) {
    if (!heap1 || !heap2) {
      return heap1 || heap2
    }

    if (heap1.elem > heap2.elem) {
      this.link(heap1, heap2)
      return heap1
    }

    this.link(heap2, heap1)
    return heap2
  }

  mergePairs(heapLL?: HeapNode| null) {
    const paired = []
    while (heapLL && heapLL.next) {
      const heap2 = heapLL.next
      const heap1 = heapLL
      heapLL = heap2.next
      paired.push(this.merge(heap1, heap2))
    }
    if (heapLL) {
      paired.push(heapLL)
    }

    let newRoot = paired.pop()
    while (paired.length) {
      const heap = paired.pop()
      newRoot = this.merge(heap, newRoot)
    }

    return newRoot
  }

}

export default Heap