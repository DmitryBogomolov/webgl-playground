import type { EventProxy } from 'lib';
import { EventEmitter } from 'lib';

export interface ChangeHandler<T> {
    (value: T): void;
}

export interface Observable<T> extends EventProxy<[T]> {
    (): T;
    (value: T): Observable<T>;
    dispose(): void;
}

const DEFAULT_NOTIFY_DELAY = 0;

export interface ObservableOptions {
    readonly noEqualityCheck?: boolean;
    readonly notifyDelay?: number;
}

export function observable<T>(initial: T, options?: ObservableOptions): Observable<T> {
    let currentValue = initial;
    let notifyId = 0;
    let disposed = false;
    const emitter = new EventEmitter<[T]>();
    patchWithMethods(target as Observable<T>, emitter, dispose);
    const noEqualityCheck = options ? Boolean(options.noEqualityCheck) : false;
    const notifyDelay = options ? (options.notifyDelay || DEFAULT_NOTIFY_DELAY) : DEFAULT_NOTIFY_DELAY;

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
            cancelNotify(notifyId);
            notifyId = scheduleNotify(notify, notifyDelay);
        }
        return target as Observable<T>;
    }
    function dispose(): void {
        disposed = true;
        cancelNotify(notifyId);
    }
    function notify(): void {
        emitter.emit(currentValue);
    }
}

type ObservableType<T> = T extends Observable<infer P> ? P : never;
type ObservableListTypes<T extends readonly unknown[]> = { -readonly [P in keyof T]: ObservableType<T[P]> };

export interface ComputedOptions {
    readonly notifyDelay?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computed<K extends ReadonlyArray<Observable<any>>, T>(
    handler: (args: ObservableListTypes<K>) => T,
    observables: K,
    options?: ComputedOptions,
): Observable<T> {
    let notifyId = 0;
    let disposed = false;
    const emitter = new EventEmitter<[T]>();
    const notifyDelay = options ? (options.notifyDelay || DEFAULT_NOTIFY_DELAY) : DEFAULT_NOTIFY_DELAY;
    patchWithMethods(target as Observable<T>, emitter, dispose);
    const valuesCache = [] as unknown as ObservableListTypes<K>;
    const handlers = [] as ((value: unknown) => void)[];
    let initialized = false;
    observables.forEach((item, i) => {
        handlers[i] = (value) => {
            valuesCache[i] = value;
            if (initialized) {
                currentValue = handler(valuesCache);
                cancelNotify(notifyId);
                notifyId = scheduleNotify(notify, notifyDelay);
            }
        };
        item.on(handlers[i]);
    });
    let currentValue = handler(valuesCache);
    initialized = true;

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
        cancelNotify(notifyId);
    }
}

function patchWithMethods<T>(target: Observable<T>, emitter: EventEmitter<[T]>, dispose: () => void): void {
    target.dispose = dispose;
    target.on = function (handler) {
        emitter.on(handler);
        handler(target());
        return this;
    };
    target.off = function (handler) {
        emitter.off(handler);
        return this;
    };
}

function scheduleNotify(notify: () => void, delay: number): number {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return setTimeout(notify as TimerHandler, delay);
}

function cancelNotify(id: number): void {
    clearTimeout(id);
}
