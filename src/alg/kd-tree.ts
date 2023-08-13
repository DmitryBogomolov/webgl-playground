import type {
    KDTreeDistance, KDTreeDistanceFunc, KDTreeAxisFuncList, KDTreeSearchItem,
} from './kd-tree.types';
import { BinaryHeap } from './binary-heap';

interface KDNode<T> {
    readonly element: T;
    readonly index: number;
    readonly lChild: KDNode<T> | null;
    readonly rChild: KDNode<T> | null;
}

interface BaseContext<T> {
    readonly axisFuncList: KDTreeAxisFuncList<T>;
    readonly distanceFunc: KDTreeDistanceFunc;
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

// https://www.cs.cmu.edu/~ckingsf/bioinfo-lectures/kdtrees.pdf
export class KDTree<T> {
    private readonly _axisFuncList: KDTreeAxisFuncList<T>;
    private readonly _distanceFunc: KDTreeDistanceFunc;
    private readonly _root: KDNode<T> | null;

    constructor(
        elements: ReadonlyArray<T>,
        axisFuncList: KDTreeAxisFuncList<T>,
        distanceFunc: KDTreeDistanceFunc = defaultDist,
    ) {
        this._axisFuncList = axisFuncList;
        this._distanceFunc = distanceFunc;
        this._root = makeNode(makeProxyList(elements), axisFuncList, 0);
    }

    findNearest(target: T): KDTreeSearchItem | null {
        if (this._root === null) {
            return null;
        }
        const context: NearestContext<T> = {
            target,
            axisFuncList: this._axisFuncList,
            distanceFunc: this._distanceFunc,
            bestIndex: -1,
            bestDistance: Number.MAX_VALUE,
        };
        findNearest(this._root, 0, initDistance(this._axisFuncList.length), context);
        return { index: context.bestIndex, distance: context.bestDistance };
    }

    findNearestMany(target: T, count: number): KDTreeSearchItem[] {
        if (this._root === null || count < 1) {
            return [];
        }
        const heap = makeHeap<T>();
        const context: NearestManyContext<T> = {
            target,
            axisFuncList: this._axisFuncList,
            distanceFunc: this._distanceFunc,
            size: count,
            heap,
        };
        findNearestMany(this._root, 0, initDistance(this._axisFuncList.length), context);
        return heapToList(heap);
    }

    findInRadius(target: T, radius: number): KDTreeSearchItem[] {
        if (this._root === null || radius < 0) {
            return [];
        }
        const heap = makeHeap<T>();
        const context: InRadiusContext<T> = {
            target,
            axisFuncList: this._axisFuncList,
            distanceFunc: this._distanceFunc,
            radius,
            heap,
        };
        findInRadius(this._root, 0, initDistance(this._axisFuncList.length), context);
        return heapToList(heap);
    }
}

function defaultDist(axes: KDTreeDistance): number {
    let dist = 0;
    for (let i = 0; i < axes.length; ++i) {
        dist += axes[i] ** 2;
    }
    return dist;
}

function makeProxyList<T>(elements: ReadonlyArray<T>): Proxy<T>[] {
    const list: Proxy<T>[] = [];
    list.length = elements.length;
    for (let i = 0; i < elements.length; ++i) {
        list[i] = { element: elements[i], idx: i };
    }
    return list;
}

function makeNode<T>(elements: Proxy<T>[], axisFuncs: KDTreeAxisFuncList<T>, axis: number): KDNode<T> | null {
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

function initDistance(axes: number): KDTreeDistance {
    return new Array<number>(axes).fill(0);
}

function updateDistance(distance: KDTreeDistance, axis: number, delta: number): KDTreeDistance {
    const copy = distance.slice();
    copy[axis] += delta;
    return copy;
}

function makeHeap<T>(): BinaryHeap<HeapItem<T>> {
    return new BinaryHeap((lhs, rhs) => lhs.distance > rhs.distance);
}

function getDistance<T>(p1: T, p2: T, axisFuncs: KDTreeAxisFuncList<T>, distFunc: KDTreeDistanceFunc): number {
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
    node: KDNode<T> | null, axis: number, distance: KDTreeDistance, context: K,
    checkNodeBox: CheckNodeBoxFunc<T, K>, visitNode: VisitNodeFunc<T, K>,
): void {
    if (node === null) {
        return;
    }
    const { target, axisFuncList: axisFuncs, distanceFunc: distFunc } = context;
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
    node: KDNode<T> | null, axis: number, distance: KDTreeDistance, context: NearestContext<T>,
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
    node: KDNode<T> | null, axis: number, distance: KDTreeDistance, context: NearestManyContext<T>,
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
    node: KDNode<T> | null, axis: number, distance: KDTreeDistance, context: InRadiusContext<T>,
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
