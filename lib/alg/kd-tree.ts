import { BinaryHeap } from './binary-heap';

export type AxisFunc<T> = (element: T) => number;
export type Distance = ReadonlyArray<number>;
export type DistFunc = (distance: Distance) => number;
type AxisFuncs<T> = ReadonlyArray<AxisFunc<T>>;

interface KDNode<T> {
    readonly element: T;
    readonly index: number;
    readonly lChild: KDNode<T> | null;
    readonly rChild: KDNode<T> | null;
}

interface BaseContext<T> {
    readonly axisFuncs: AxisFuncs<T>;
    readonly distFunc: DistFunc;
    readonly target: T;
}

interface NearestContext<T> extends BaseContext<T> {
    bestIndex: number;
    bestDistance: number;
}

interface HeapItem<T> {
    readonly element: T;
    readonly index: number;
    readonly distance: number;
}

interface NearestManyContext<T> extends BaseContext<T> {
    readonly size: number;
    readonly heap: BinaryHeap<HeapItem<T>>;
}

interface InRadiusContext<T> extends BaseContext<T> {
    readonly radius: number;
    readonly heap: BinaryHeap<HeapItem<T>>;
}

interface Proxy<T> {
    readonly element: T;
    readonly idx: number;
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
        const context: NearestContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            bestIndex: -1,
            bestDistance: Number.MAX_VALUE,
        };
        findNearest(this._root, 0, initDistance(this._axisFuncs.length), context);
        return { index: context.bestIndex, distance: context.bestDistance };
    }

    findNearestMany(target: T, count: number): KDTreeSearchItem[] {
        if (this._root === null || count < 1) {
            return [];
        }
        const heap = makeHeap<T>();
        const context: NearestManyContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            size: count,
            heap,
        };
        findNearestMany(this._root, 0, initDistance(this._axisFuncs.length), context);
        return heapToList(heap);
    }

    findInRadius(target: T, radius: number): KDTreeSearchItem[] {
        if (this._root === null || radius < 0) {
            return [];
        }
        const heap = makeHeap<T>();
        const context: InRadiusContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            radius,
            heap,
        };
        findInRadius(this._root, 0, initDistance(this._axisFuncs.length), context);
        return heapToList(heap);
    }
}

function makeProxyList<T>(elements: ReadonlyArray<T>): Proxy<T>[] {
    const list: Proxy<T>[] = [];
    list.length = elements.length;
    for (let i = 0; i < elements.length; ++i) {
        list[i] = { element: elements[i], idx: i };
    }
    return list;
}

function makeNode<T>(elements: Proxy<T>[], axisFuncs: AxisFuncs<T>, axis: number): KDNode<T> | null {
    if (elements.length === 0) {
        return null;
    }
    if (elements.length === 1) {
        return {
            element: elements[0].element,
            index: elements[0].idx,
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
        index: elements[center].idx,
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

function makeHeap<T>(): BinaryHeap<HeapItem<T>> {
    return new BinaryHeap((lhs, rhs) => lhs.distance > rhs.distance);
}

function getDistance<T>(p1: T, p2: T, axisFuncs: AxisFuncs<T>, distFunc: DistFunc): number {
    const dist: number[] = [];
    for (let i = 0; i < axisFuncs.length; ++i) {
        const axisFunc = axisFuncs[i];
        dist[i] = axisFunc(p1) - axisFunc(p2);
    }
    return distFunc(dist);
}

type CheckNodeBoxFunc<T, K extends BaseContext<T>> = (boxDist: number, context: K) => boolean;
type VisitNodeFunc<T, K extends BaseContext<T>> = (node: KDNode<T>, nodeDist: number, context: K) => void;

function walkTree<T, K extends BaseContext<T>>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: K,
    checkNodeBox: CheckNodeBoxFunc<T, K>, visitNode: VisitNodeFunc<T, K>,
): void {
    if (node === null) {
        return;
    }
    const { target, axisFuncs, distFunc } = context;
    const targetToBoxDistance = distFunc(distance);
    if (checkNodeBox(targetToBoxDistance, context)) {
        return;
    }
    const targetToNodeDistance = getDistance(target, node.element, axisFuncs, distFunc);
    visitNode(node, targetToNodeDistance, context);
    const nextAxis = (axis + 1) % axisFuncs.length;
    const axisDist = axisFuncs[axis](target) - axisFuncs[axis](node.element);
    const isLeft = axisDist < 0;
    const lDist = isLeft ? distance : updateDistance(distance, axis, +axisDist);
    const rDist = isLeft ? updateDistance(distance, axis, -axisDist) : distance;
    walkTree(isLeft ? node.lChild : node.rChild, nextAxis, isLeft ? lDist : rDist, context, checkNodeBox, visitNode);
    walkTree(isLeft ? node.rChild : node.lChild, nextAxis, isLeft ? rDist : lDist, context, checkNodeBox, visitNode);
}

function checkNodeBoxNearest<T>(boxDistance: number, { bestDistance }: NearestContext<T>): boolean {
    return boxDistance > bestDistance;
}

function visitNodeNearest<T>(node: KDNode<T>, nodeDistance: number, context: NearestContext<T>): void {
    if (nodeDistance < context.bestDistance) {
        context.bestDistance = nodeDistance;
        context.bestIndex = node.index;
    }
}

function findNearest<T>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: NearestContext<T>,
): void {
    walkTree(node, axis, distance, context, checkNodeBoxNearest, visitNodeNearest);
}

function checkNodeBoxNearestMany<T>(boxDistance: number, { heap, size }: NearestManyContext<T>): boolean {
    return heap.size() === size && boxDistance > heap.peek().distance;
}

function visitNodeNearestMany<T>(node: KDNode<T>, nodeDistance: number, { heap, size }: NearestManyContext<T>): void {
    if (heap.size() < size || nodeDistance < heap.peek().distance) {
        if (heap.size() === size) {
            heap.pop();
        }
        heap.push({ element: node.element, index: node.index, distance: nodeDistance });
    }
}

function findNearestMany<T>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: NearestManyContext<T>,
): void {
    walkTree(node, axis, distance, context, checkNodeBoxNearestMany, visitNodeNearestMany);
}

function checkNodeBoxInRadius<T>(boxDistance: number, { radius }: InRadiusContext<T>): boolean {
    return boxDistance > radius;
}

function visitNodeInRadius<T>(node: KDNode<T>, nodeDistance: number, { heap, radius }: InRadiusContext<T>): void {
    if (nodeDistance <= radius) {
        heap.push({ element: node.element, index: node.index, distance: nodeDistance });
    }
}

function findInRadius<T>(
    node: KDNode<T> | null, axis: number, distance: Distance, context: InRadiusContext<T>,
): void {
    walkTree(node, axis, distance, context, checkNodeBoxInRadius, visitNodeInRadius);
}

function heapToList<T>(heap: BinaryHeap<HeapItem<T>>): KDTreeSearchItem[] {
    const list: KDTreeSearchItem[] = [];
    list.length = heap.size();
    for (let i = list.length - 1; i >= 0; --i) {
        const { index, distance } = heap.pop();
        list[i] = { index, distance };
    }
    return list;
}
