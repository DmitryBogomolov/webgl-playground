import {
    EventEmitter,
} from 'lib';

export interface ChangeHandler<T> {
    (value: T): void;
}

export interface Observable<T> {
    (): T;
    (value: T): Observable<T>;
    on(handler: ChangeHandler<T>): void;
    off(handler: ChangeHandler<T>): void;
}

export function observable<T>(initial: T): Observable<T> {
    let currentValue = initial;
    const emitter = new EventEmitter<T>();
    patchWithEmitter(target as unknown as Observable<T>, emitter);

    return target as unknown as Observable<T>;

    function target(value: T | undefined): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        if (currentValue !== value) {
            currentValue = value;
            // @ts-ignore TODO: Resolve it!
            emitter.emit(currentValue);
        }
        return target as unknown as Observable<T>;
    }
}

export interface ComputedHandler<T> {
    (values: ReadonlyArray<T>): number;
}

export function computed<T>(handler: ComputedHandler<T>, observables: ReadonlyArray<Observable<T>>): Observable<T> {
    const emitter = new EventEmitter<T>();
    patchWithEmitter(target as unknown as Observable<T>, emitter);
    const valuesCache: T[] = [];
    observables.forEach((item, i) => {
        valuesCache[i] = item();
        item.on((value) => {
            valuesCache[i] = value;
            currentValue = handler(valuesCache);
            // @ts-ignore TODO: Resolve it!
            emitter.emit(currentValue);
        });
    });
    let currentValue = handler(valuesCache);

    return target as unknown as Observable<T>;

    function target(): number {
        return currentValue;
    }
}

function patchWithEmitter<T>(target: Observable<T>, emitter: EventEmitter<T>): void {
    // @ts-ignore TODO: Resolve it!
    target.on = (handler: ChangeHandler<T>) => emitter.on(handler);
    // @ts-ignore TODO: Resolve it!
    target.off = (handler: ChangeHandler<T>) => emitter.off(handler);
}
