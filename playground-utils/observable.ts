import type { EventProxy } from 'lib';
import { EventEmitter } from 'lib';

export interface Observable<T> extends EventProxy {
    (): T;
    (value: T): this;
}

export function observable<T>(initial: T): Observable<T> {
    let currentValue = initial;
    const emitter = new EventEmitter();
    setupOnOff(target as Observable<T>, emitter.proxy);

    return target as Observable<T>;

    function target(value?: T): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        if (currentValue !== value) {
            currentValue = value;
            emitter.emit();
        }
        return target as Observable<T>;
    }
}

// export function computed<K extends readonly unknown[], T>(
//     handler: (args: K) => T,
//     observables: { readonly [P in keyof K]: Observable<K[P]> },
// ): Observable<T>
export function computed<P1, T>(
    handler: (args: Readonly<[P1]>) => T,
    observables: Readonly<[Observable<P1>]>,
): Observable<T>;
export function computed<P1, P2, T>(
    handler: (args: Readonly<[P1, P2]>) => T,
    observables: Readonly<[Observable<P1>, Observable<P2>]>,
): Observable<T>;
export function computed<P1, P2, P3, T>(
    handler: (args: Readonly<[P1, P2, P3]>) => T,
    observables: Readonly<[Observable<P1>, Observable<P2>, Observable<P3>]>,
): Observable<T>;
export function computed<P, T>(
    handler: (args: P) => T,
    observables: Iterable<Observable<unknown>>,
): Observable<T> {
    let isChanged = true;
    let currentValue: T;
    const emitter = new EventEmitter();
    setupOnOff(target as Observable<T>, emitter.proxy);
    const list = Array.from(observables, (obj) => {
        obj.on(notify);
        return obj;
    });
    const valuesCache: unknown[] = [];
    valuesCache.length = list.length;

    return target as Observable<T>;

    function target(value?: T): T {
        if (value !== undefined) {
            throw new Error('computed:read_only');
        }
        if (isChanged) {
            calculate();
            isChanged = false;
        }
        return currentValue;
    }

    function calculate(): void {
        for (let i = 0; i < list.length; ++i) {
            valuesCache[i] = list[i]();
        }
        currentValue = handler(valuesCache as unknown as P);
    }

    function notify(): void {
        isChanged = true;
        emitter.emit();
    }
}

function setupOnOff<T>(target: Observable<T>, emitter: EventProxy): void {
    target.on = (handler) => {
        emitter.on(handler);
        return target;
    };
    target.off = (handler) => {
        emitter.off(handler);
        return target;
    };
}

export function bind<T>(observable: Observable<T>, func: (value: T) => void): () => void {
    observable.on(handleChange);
    handleChange();

    return () => {
        observable.off(handleChange);
    };

    function handleChange(): void {
        func(observable());
    }
}

export function wrapped<T>(get: () => T, changed: EventProxy): Observable<T> {
    let isChanged = true;
    let currentValue: T;
    const emitter = new EventEmitter();
    setupOnOff(target as Observable<T>, emitter.proxy);
    changed.on(notify);
    return target as Observable<T>;

    function target(value?: T): T {
        if (value !== undefined) {
            throw new Error('wrapped:read_only');
        }
        if (isChanged) {
            currentValue = get();
            isChanged = false;
        }
        return currentValue;
    }

    function notify(): void {
        isChanged = true;
        emitter.emit();
    }
}
