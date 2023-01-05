type CmpFunc<T> = (lhs: T, rhs: T) => boolean;

function getParentIdx(idx: number): number {
    return (idx - 1) >> 1;
}

function getChildIdx(idx: number): number {
    return 2 * idx + 1;
}

function swap<T>(elements: T[], i: number, j: number): void {
    const tmp = elements[i];
    elements[i] = elements[j];
    elements[j] = tmp;
}

function compare<T>(elements: T[], i: number, j: number, cmp: CmpFunc<T>): boolean {
    return cmp(elements[i], elements[j]);
}

function swim<T>(elements: T[], idx: number, cmp: CmpFunc<T>): void {
    for (let childIdx = idx; childIdx > 0;) {
        const parentIdx = getParentIdx(childIdx);
        if (compare(elements, parentIdx, childIdx, cmp)) {
            break;
        }
        swap(elements, parentIdx, childIdx);
        childIdx = parentIdx;
    }
}

function sink<T>(elements: T[], idx: number, cmp: CmpFunc<T>): void {
    const len = elements.length;
    for (let parentIdx = idx; parentIdx < len >> 1;) {
        let childIdx = getChildIdx(parentIdx);
        if (childIdx < len - 1 && compare(elements, childIdx + 1, childIdx, cmp)) {
            ++childIdx;
        }
        if (compare(elements, parentIdx, childIdx, cmp)) {
            break;
        }
        swap(elements, parentIdx, childIdx);
        parentIdx = childIdx;
    }
}

function defaultCmp<T>(lhs: T, rhs: T): boolean {
    return lhs > rhs;
}

export class BinaryHeap<T> {
    private readonly _cmpFunc: CmpFunc<T>;
    private _elements: T[] = [];

    constructor(cmpFunc: (lhs: T, rhs: T) => boolean = defaultCmp) {
        this._cmpFunc = cmpFunc;
    }

    size(): number {
        return this._elements.length;
    }

    push(element: T): void {
        this._elements.push(element);
        swim(this._elements, this._elements.length - 1, this._cmpFunc);
    }

    pop(): T {
        const element = this._elements[0];
        swap(this._elements, 0, this._elements.length - 1);
        this._elements.pop();
        sink(this._elements, 0, this._cmpFunc);
        return element;
    }

    peek(): T {
        return this._elements[0];
    }

    clear(): void {
        this._elements.length = 0;
    }

    remove(element: T): boolean {
        const idx = this._elements.indexOf(element);
        if (idx < 0) {
            return false;
        }
        swap(this._elements, idx, this._elements.length - 1);
        this._elements.pop();
        swim(this._elements, idx, this._cmpFunc);
        sink(this._elements, idx, this._cmpFunc);
        return true;
    }
}
