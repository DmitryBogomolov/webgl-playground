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

export interface ObservableOptions {
    readonly noEqualityCheck?: boolean;
}

export function observable<T>(initial: T, options?: ObservableOptions): Observable<T> {
    let currentValue = initial;
    const emitter = new EventEmitter<[T]>();
    patchWithEmitter(target as Observable<T>, emitter);
    const noEqualityCheck = options ? Boolean(options.noEqualityCheck) : false;

    return target as Observable<T>;

    function target(value?: T): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        if (noEqualityCheck || value !== currentValue) {
            currentValue = value;
            emitter.emit(currentValue);
        }
        return target as Observable<T>;
    }
}

type ObservableType<T> = T extends Observable<infer P> ? P : never;
type ObservableListTypes<T extends readonly unknown[]> = { -readonly [P in keyof T]: ObservableType<T[P]> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computed<K extends ReadonlyArray<Observable<any>>, T>(
    handler: (args: ObservableListTypes<K>) => T,
    observables: K,
): Observable<T> {
    const emitter = new EventEmitter<[T]>();
    patchWithEmitter(target as Observable<T>, emitter);
    const valuesCache = [] as unknown as ObservableListTypes<K>;
    observables.forEach((item, i) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        valuesCache[i] = item();
        item.on((value) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            valuesCache[i] = value;
            currentValue = handler(valuesCache);
            emitter.emit(currentValue);
        });
    });
    let currentValue = handler(valuesCache);

    return target as Observable<T>;

    function target(value?: T): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        throw new Error('computed is read only');
    }
}

function patchWithEmitter<T>(target: Observable<T>, emitter: EventEmitter<[T]>): void {
    target.on = function (handler) {
        emitter.on(handler);
    };
    target.off = function (handler) {
        emitter.off(handler);
    };
}
