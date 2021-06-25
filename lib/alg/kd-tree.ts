import { BinaryHeap } from './binary-heap';

export type AxisFunc<T> = (element: T) => number;
export type Distance = ReadonlyArray<number>;
export type DistFunc = (distance: Distance) => number;
type AxisFuncs<T> = ReadonlyArray<AxisFunc<T>>;

interface KDNode<T> {
    readonly element: T;
    readonly idx: number;
    readonly lChild: KDNode<T> | null;
    readonly rChild: KDNode<T> | null;
}

interface SearchContext<T> {
    readonly axisFuncs: AxisFuncs<T>;
    readonly distFunc: DistFunc;
    readonly target: T;
    bestDistance: number;
    bestIndex: number;
}

interface KHeapItem<T> {
    readonly element: T;
    readonly index: number;
    readonly distance: number;
}

interface KSearchContext<T> {
    readonly axisFuncs: AxisFuncs<T>;
    readonly distFunc: DistFunc;
    readonly target: T;
    readonly size: number;
    readonly heap: BinaryHeap<KHeapItem<T>>;
}

interface RadiusSearchContext<T> {
    readonly axisFuncs: AxisFuncs<T>;
    readonly distFunc: DistFunc;
    readonly target: T;
    readonly radius: number;
    readonly heap: BinaryHeap<KHeapItem<T>>;
}

interface Proxy<T> {
    readonly element: T;
    readonly idx: number;
}

function makeProxyList<T>(elements: ReadonlyArray<T>): Proxy<T>[] {
    const list: Proxy<T>[] = [];
    list.length = elements.length;
    for (let i = 0; i < elements.length; ++i) {
        list[i] = { element: elements[i], idx: i };
    }
    return list;
}

export interface KDTreeSearchItem {
    readonly index: number;
    readonly distance: number;
}

// https://www.cs.cmu.edu/~ckingsf/bioinfo-lectures/kdtrees.pdf
export class KDTree<T> {
    private readonly _axisFuncs: AxisFuncs<T>;
    private readonly _distFunc: DistFunc;
    private readonly _root: KDNode<T> | null;

    constructor(elements: ReadonlyArray<T>, axisFuncs: AxisFuncs<T>, distFunc: DistFunc) {
        this._axisFuncs = axisFuncs;
        this._distFunc = distFunc;
        this._root = makeNode(makeProxyList(elements), axisFuncs, 0);
    }

    findNearest(target: T): KDTreeSearchItem | null {
        if (this._root === null) {
            return null;
        }
        const context: SearchContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            bestDistance: Number.MAX_VALUE,
            bestIndex: -1,
        };
        findNearest(this._root, 0, initDistance(this._axisFuncs.length), context);
        return { index: context.bestIndex, distance: context.bestDistance };
    }

    findKNearest(target: T, count: number): KDTreeSearchItem[] {
        const list: KDTreeSearchItem[] = [];
        if (this._root === null || count < 1) {
            return list;
        }
        const heap = new BinaryHeap<KHeapItem<T>>((a, b) => a.distance > b.distance);
        const context: KSearchContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            size: count,
            heap,
        };
        findKNearest(this._root, 0, initDistance(this._axisFuncs.length), context);
        list.length = heap.size();
        for (let i = list.length - 1; i >= 0; --i) {
            const { index, distance } = heap.pop();
            list[i] = { index, distance };
        }
        return list;
    }

    findInRadius(target: T, radius: number): KDTreeSearchItem[] {
        const list: KDTreeSearchItem[] = [];
        if (this._root === null || radius < 0) {
            return list;
        }
        const heap = new BinaryHeap<KHeapItem<T>>((a, b) => a.distance > b.distance);
        const context: RadiusSearchContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            radius,
            heap,
        };
        findInRadius(this._root, 0, initDistance(this._axisFuncs.length), context);
        list.length = heap.size();
        for (let i = list.length - 1; i >= 0; --i) {
            const { index, distance } = heap.pop();
            list[i] = { index, distance };
        }
        return list;
    }
}

function makeNode<T>(elements: Proxy<T>[], axisFuncs: AxisFuncs<T>, axis: number): KDNode<T> | null {
    if (elements.length === 0) {
        return null;
    }
    if (elements.length === 1) {
        return {
            element: elements[0].element,
            idx: elements[0].idx,
            lChild: null,
            rChild: null,
        };
    }
    const axisFunc = axisFuncs[axis];
    elements.sort((lhs, rhs) => axisFunc(lhs.element) - axisFunc(rhs.element));
    let center = elements.length >> 1;
    while (center > 0 && axisFunc(elements[center - 1].element) === axisFunc(elements[center].element)) {
        --center;
    }
    const lList = elements.slice(0, center);
    const rList = elements.slice(center + 1);
    const nextAxis = (axis + 1) % axisFuncs.length;
    return {
        element: elements[center].element,
        idx: elements[center].idx,
        lChild: makeNode(lList, axisFuncs, nextAxis),
        rChild: makeNode(rList, axisFuncs, nextAxis),
    };
}

function initDistance(axes: number): Distance {
    return new Array<number>(axes).fill(0);
}

function updateDistance(distance: Distance, axis: number, delta: number): Distance {
    const copy = distance.slice();
    copy[axis] += delta;
    return copy;
}

function getDistance<T>(p1: T, p2: T, axisFuncs: AxisFuncs<T>, distFunc: DistFunc): number {
    const dist: number[] = [];
    for (let i = 0; i < axisFuncs.length; ++i) {
        const axisFunc = axisFuncs[i];
        dist[i] = axisFunc(p1) - axisFunc(p2);
    }
    return distFunc(dist);
}

function findNearest<T>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: SearchContext<T>,
): void {
    if (node === null) {
        return;
    }
    const { target, axisFuncs, distFunc } = context;
    const targetToBoxDistance = distFunc(distance);
    if (targetToBoxDistance > context.bestDistance) {
        return;
    }
    const targetToNodeDistance = getDistance(target, node.element, axisFuncs, distFunc);
    if (targetToNodeDistance < context.bestDistance) {
        context.bestDistance = targetToNodeDistance;
        context.bestIndex = node.idx;
    }
    const nextAxis = (axis + 1) % axisFuncs.length;
    const axisDist = axisFuncs[axis](target) - axisFuncs[axis](node.element);
    const isLeft = axisDist < 0;
    const lDist = isLeft ? distance : updateDistance(distance, axis, +axisDist);
    const rDist = isLeft ? updateDistance(distance, axis, -axisDist) : distance;
    findNearest(isLeft ? node.lChild : node.rChild, nextAxis, isLeft ? lDist : rDist, context);
    findNearest(isLeft ? node.rChild : node.lChild, nextAxis, isLeft ? rDist : lDist, context);
}

function findKNearest<T>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: KSearchContext<T>,
): void {
    if (node === null) {
        return;
    }
    const { target, axisFuncs, distFunc, heap, size } = context;
    const targetToBoxDistance = distFunc(distance);
    if (heap.size() === size && targetToBoxDistance > heap.peek().distance) {
        return;
    }
    const targetToNodeDistance = getDistance(target, node.element, axisFuncs, distFunc);
    if (heap.size() < size || targetToNodeDistance < heap.peek().distance) {
        if (heap.size() === size) {
            heap.pop();
        }
        heap.push({ element: node.element, index: node.idx, distance: targetToNodeDistance });
    }
    const nextAxis = (axis + 1) % axisFuncs.length;
    const axisDist = axisFuncs[axis](target) - axisFuncs[axis](node.element);
    const isLeft = axisDist < 0;
    const lDist = isLeft ? distance : updateDistance(distance, axis, +axisDist);
    const rDist = isLeft ? updateDistance(distance, axis, -axisDist) : distance;
    findKNearest(isLeft ? node.lChild : node.rChild, nextAxis, isLeft ? lDist : rDist, context);
    findKNearest(isLeft ? node.rChild : node.lChild, nextAxis, isLeft ? rDist : lDist, context);
}

function findInRadius<T>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: RadiusSearchContext<T>,
): void {
    if (node === null) {
        return;
    }
    const { target, axisFuncs, distFunc, radius, heap } = context;
    const targetToBoxDistance = distFunc(distance);
    if (targetToBoxDistance > radius) {
        return;
    }
    const targetToNodeDistance = getDistance(target, node.element, axisFuncs, distFunc);
    if (targetToNodeDistance <= radius) {
        heap.push({ element: node.element, index: node.idx, distance: targetToNodeDistance });
    }
    const nextAxis = (axis + 1) % axisFuncs.length;
    const axisDist = axisFuncs[axis](target) - axisFuncs[axis](node.element);
    const isLeft = axisDist < 0;
    const lDist = isLeft ? distance : updateDistance(distance, axis, +axisDist);
    const rDist = isLeft ? updateDistance(distance, axis, -axisDist) : distance;
    findInRadius(isLeft ? node.lChild : node.rChild, nextAxis, isLeft ? lDist : rDist, context);
    findInRadius(isLeft ? node.rChild : node.lChild, nextAxis, isLeft ? rDist : lDist, context);
}
