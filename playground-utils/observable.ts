import type { EventProxy } from 'lib';
import { EventEmitter } from 'lib';

export interface Observable<T> extends EventProxy {
    (): T;
    (value: T): this;
}

export interface ObservableOptions {
    // TODO: cmp function + with T parameter
    readonly noEqualityCheck?: boolean;
}

function compareDefault<T>(curr: T, next: T): boolean {
    return curr === next;
}

function compareNone(): boolean {
    return false;
}

export function observable<T>(initial: T, options?: ObservableOptions): Observable<T> {
    let currentValue = initial;
    const emitter = new EventEmitter();
    const cmp = options?.noEqualityCheck ? compareNone : compareDefault;
    setupOnOff(target as Observable<T>, emitter.proxy());

    return target as Observable<T>;

    function target(value?: T): T | Observable<T> {
        if (value === undefined) {
            return currentValue;
        }
        if (!cmp(currentValue, value)) {
            currentValue = value;
            emitter.emit();
        }
        return target as Observable<T>;
    }
}

type ObservableType<T> = T extends Observable<infer P> ? P : never;
type ObservableListTypes<T extends readonly unknown[]> = { -readonly [P in keyof T]: ObservableType<T[P]> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computed<K extends readonly Observable<any>[], T>(
    handler: (args: ObservableListTypes<K>) => T,
    observables: K,
): Observable<T> {
    let isDirty = true;
    let currentValue: T;
    const emitter = new EventEmitter();
    setupOnOff(target as Observable<T>, emitter.proxy());
    const valuesCache: unknown[] = [];
    valuesCache.length = observables.length;
    // TODO: Use WeakRef.
    for (let i = 0; i < observables.length; ++i) {
        observables[i].on(notify);
    }

    return target as Observable<T>;

    function target(value?: T): T {
        if (value !== undefined) {
            throw new Error('computed:read_only');
        }
        calculate();
        return currentValue;
    }

    function calculate(): void {
        if (!isDirty) {
            return;
        }
        for (let i = 0; i < observables.length; ++i) {
            valuesCache[i] = observables[i]();
        }
        currentValue = handler(valuesCache as ObservableListTypes<K>);
        isDirty = false;
    }

    function notify(): void {
        isDirty = true;
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
