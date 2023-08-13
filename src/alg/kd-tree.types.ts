export type KDTreeAxisFunc<T> = (element: T) => number;
export type KDTreeDistance = ReadonlyArray<number>;
export type KDTreeDistanceFunc = (distance: KDTreeDistance) => number;
export type KDTreeAxisFuncList<T> = ReadonlyArray<KDTreeAxisFunc<T>>;
export interface KDTreeSearchItem {
    readonly index: number;
    readonly distance: number;
}
