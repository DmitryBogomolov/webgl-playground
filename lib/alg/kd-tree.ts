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
        const distance = new Array(this._axisFuncs.length);
        distance.fill(0);
        const info: NearestInfo<T> = {
            bestDistance: Number.MAX_VALUE,
            bestElement: null,
        };
        findNearest(target, this._root, this._axisFuncs, this._distFunc, 0, distance, info);
        return info.bestElement;
    }
}

type DistFunc = (axes: ReadonlyArray<number>) => number;
type AxisFunc<T> = (element: T) => number;
type AxisFuncs<T> = ReadonlyArray<AxisFunc<T>>;

interface KDNode<T> {
    readonly element: T;
    readonly lChild: KDNode<T> | null;
    readonly rChild: KDNode<T> | null;
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

interface NearestInfo<T> {
    bestDistance: number;
    bestElement: T | null;
}

function findNearest<T>(
    target: T, node: KDNode<T> | null,
    axisFuncs: AxisFuncs<T>, distFunc: DistFunc, axis: number,
    distance: ReadonlyArray<number>, info: NearestInfo<T>,
): void {
    if (node === null) {
        return;
    }
    const targetToBoxDistance = distFunc(distance);
    if (targetToBoxDistance > info.bestDistance) {
        return;
    }
    const dist: number[] = [];
    for (let i = 0; i < axisFuncs.length; ++i) {
        dist[i] = axisFuncs[i](target) - axisFuncs[i](node.element);
    }
    const targetToNodeDistance = distFunc(dist);
    if (targetToNodeDistance < info.bestDistance) {
        info.bestDistance = targetToNodeDistance;
        info.bestElement = node.element;
    }
    const nextAxis = (axis + 1) % axisFuncs.length;
    const axisDist = axisFuncs[axis](target) - axisFuncs[axis](node.element);
    const lDist = distance.slice();
    const rDist = distance.slice();
    if (axisDist < 0) {
        rDist[axis] -= axisDist;
        findNearest(target, node.lChild, axisFuncs, distFunc, nextAxis, lDist, info);
        findNearest(target, node.rChild, axisFuncs, distFunc, nextAxis, rDist, info);
    } else {
        lDist[axis] += axisDist;
        findNearest(target, node.rChild, axisFuncs, distFunc, nextAxis, rDist, info);
        findNearest(target, node.lChild, axisFuncs, distFunc, nextAxis, lDist, info);
    }
}
