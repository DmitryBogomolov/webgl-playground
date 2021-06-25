export type AxisFunc<T> = (element: T) => number;
export type DistFunc = (axes: ReadonlyArray<number>) => number;
type AxisFuncs<T> = ReadonlyArray<AxisFunc<T>>;

interface KDNode<T> {
    readonly element: T;
    readonly lChild: KDNode<T> | null;
    readonly rChild: KDNode<T> | null;
}

interface SearchContext<T> {
    readonly axisFuncs: AxisFuncs<T>;
    readonly distFunc: DistFunc;
    readonly target: T;
    bestDistance: number;
    bestElement: T;
}

// TODO: Find k nearest.
// TODO: Find in radius.
// https://www.cs.cmu.edu/~ckingsf/bioinfo-lectures/kdtrees.pdf
export class KDTree<T> {
    private readonly _axisFuncs: AxisFuncs<T>;
    private readonly _distFunc: DistFunc;
    private readonly _root: KDNode<T> | null;

    constructor(elements: ReadonlyArray<T>, axisFuncs: AxisFuncs<T>, distFunc: DistFunc) {
        this._axisFuncs = axisFuncs;
        this._distFunc = distFunc;
        this._root = makeNode(Array.from(elements), axisFuncs, 0);
    }

    findNearest(target: T): T | null {
        if (this._root === null) {
            return null;
        }
        const distance = new Array(this._axisFuncs.length);
        distance.fill(0);
        const context: SearchContext<T> = {
            target,
            axisFuncs: this._axisFuncs,
            distFunc: this._distFunc,
            bestDistance: Number.MAX_VALUE,
            bestElement: null as unknown as T,
        };
        findNearest(this._root, 0, distance, context);
        return context.bestElement;
    }
}

function makeNode<T>(elements: T[], axisFuncs: AxisFuncs<T>, axis: number): KDNode<T> | null {
    if (elements.length === 0) {
        return null;
    }
    if (elements.length === 1) {
        return {
            element: elements[0],
            lChild: null,
            rChild: null,
        };
    }
    const axisFunc = axisFuncs[axis];
    elements.sort((lhs, rhs) => axisFunc(lhs) - axisFunc(rhs));
    let center = elements.length >> 1;
    while (center > 0 && axisFunc(elements[center - 1]) === axisFunc(elements[center])) {
        --center;
    }
    const lList = elements.slice(0, center);
    const rList = elements.slice(center + 1);
    const nextAxis = (axis + 1) % axisFuncs.length;
    return {
        element: elements[center],
        lChild: makeNode(lList, axisFuncs, nextAxis),
        rChild: makeNode(rList, axisFuncs, nextAxis),
    };
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
    node: KDNode<T> | null, axis: number, distance: ReadonlyArray<number>, context: SearchContext<T>,
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
        context.bestElement = node.element;
    }
    const nextAxis = (axis + 1) % axisFuncs.length;
    const axisDist = axisFuncs[axis](target) - axisFuncs[axis](node.element);
    const lDist = distance.slice();
    const rDist = distance.slice();
    if (axisDist < 0) {
        rDist[axis] -= axisDist;
        findNearest(node.lChild, nextAxis, lDist, context);
        findNearest(node.rChild, nextAxis, rDist, context);
    } else {
        lDist[axis] += axisDist;
        findNearest(node.rChild, nextAxis, rDist, context);
        findNearest(node.lChild, nextAxis, lDist, context);
    }
}
