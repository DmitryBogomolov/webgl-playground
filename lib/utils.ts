import { formatStr } from './utils/string-formatter';

let nextId = 1;

export function generateId(name: string): string {
    return `${name}#${nextId++}`;
}

let isLogSilenced = false;

export function logSilenced(state: boolean): void {
    isLogSilenced = !!state;
}

export class Logger {
    private readonly _prefix: string;

    constructor(name: string) {
        this._prefix = `[${name}]: `;
    }

    private _wrap(format: string, ...params: unknown[]): string {
        return this._prefix + formatStr(format, ...params);
    }

    log(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.log(message);
        return message;
    }

    warn(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.warn(message);
        return message;
    }

    error(format: string, ...params: unknown[]): Error {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.error(message);
        throw new Error(message);
    }
}

export function generateDefaultIndexes(vertexCount: number): number[] {
    const data: number[] = [];
    data.length = vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
        data[i] = i;
    }
    return data;
}

export function throttle<T extends (...args: any[]) => void>(func: T, duration: number): T {
    let timeout = 0;
    let lastTime = 0;
    let pendingArgs: Parameters<T> | null = null;
    function handler(): void {
        timeout = 0;
        lastTime = Date.now();
        func(...pendingArgs!);
        pendingArgs = null;
    }
    function throttledFunc(...args: Parameters<T>): void {
        const time = Date.now();
        const timespan = time - lastTime;
        if (timespan > duration) {
            lastTime = time;
            func(...args);
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        timeout = timeout || setTimeout(handler as TimerHandler, duration - timespan);
        pendingArgs = args;
    }
    return throttledFunc as T;
}

export type CancelSubscriptionCallback = () => void;

export function handleWindowResize(callback: () => void, timespan: number = 250): CancelSubscriptionCallback {
    const listener = throttle(callback, timespan);
    window.addEventListener('resize', listener);
    return () => {
        window.removeEventListener('resize', listener);
    };
}
