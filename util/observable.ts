import {
    EventEmitter,
} from 'lib';

export interface ChangeHandler<T> {
    (value: T): void;
}

export interface Observable<T> {
    (): T;
    (value: T): Observable<T>;
    dispose(): void;
    on(handler: ChangeHandler<T>): void;
    off(handler: ChangeHandler<T>): void;
}

export interface ObservableOptions {
    readonly noEqualityCheck?: boolean;
}

export function observable<T>(initial: T, options?: ObservableOptions): Observable<T> {
    let currentValue = initial;
    let notifyTimeout = 0;
    let disposed = false;
    const emitter = new EventEmitter<[T]>();
    patchWithMethods(target as Observable<T>, emitter, dispose);
    const noEqualityCheck = options ? Boolean(options.noEqualityCheck) : false;

    return target as Observable<T>;

    function target(value?: T): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        if (disposed) {
            throw new Error('disposed');
        }
        if (noEqualityCheck || value !== currentValue) {
            currentValue = value;
            window.clearTimeout(notifyTimeout);
            notifyTimeout = window.setTimeout(notify, 0);
        }
        return target as Observable<T>;
    }
    function dispose(): void {
        disposed = true;
        window.clearTimeout(notifyTimeout);
    }
    function notify(): void {
        emitter.emit(currentValue);
    }
}

type ObservableType<T> = T extends Observable<infer P> ? P : never;
type ObservableListTypes<T extends readonly unknown[]> = { -readonly [P in keyof T]: ObservableType<T[P]> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computed<K extends ReadonlyArray<Observable<any>>, T>(
    handler: (args: ObservableListTypes<K>) => T,
    observables: K,
): Observable<T> {
    let notifyTimeout = 0;
    let disposed = false;
    const emitter = new EventEmitter<[T]>();
    patchWithMethods(target as Observable<T>, emitter, dispose);
    const valuesCache = [] as unknown as ObservableListTypes<K>;
    const handlers = [] as ((value: unknown) => void)[];
    observables.forEach((item, i) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        valuesCache[i] = item();
        handlers[i] = (value) => {
            valuesCache[i] = value;
            currentValue = handler(valuesCache);
            window.clearTimeout(notifyTimeout);
            notifyTimeout = window.setTimeout(notify, 0);
        };
        item.on(handlers[i]);
    });
    let currentValue = handler(valuesCache);

    return target as Observable<T>;

    function target(value?: T): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        if (disposed) {
            throw new Error('disposed');
        }
        throw new Error('computed is read only');
    }
    function notify(): void {
        emitter.emit(currentValue);
    }
    function dispose(): void {
        disposed = true;
        observables.forEach((item, i) => {
            item.off(handlers[i]);
        });
        window.clearTimeout(notifyTimeout);
    }
}

function patchWithMethods<T>(target: Observable<T>, emitter: EventEmitter<[T]>, dispose: () => void): void {
    target.dispose = dispose;
    target.on = function (handler) {
        emitter.on(handler);
    };
    target.off = function (handler) {
        emitter.off(handler);
    };
}
