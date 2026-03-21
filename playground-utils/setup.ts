import type { RuntimeParams, EventProxy, LogHandler, LogLevel } from 'lib';
import { Runtime } from 'lib';
import { hasUrlParam } from './url';

export function setup(params?: Partial<RuntimeParams>): { runtime: Runtime, container: HTMLElement } {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const log = !hasUrlParam('no-logger') ? createLogger() : undefined;
    const runtime = new Runtime({
        element: container,
        log,
        ...params,
    });
    return { runtime, container };
}

interface Item {
    readonly kind: LogLevel;
    readonly message: string;
}

const handlers: Readonly<Record<LogLevel, (message: string) => void>> = {
    INFO: (message) => {
        console.info(message);
    },
    WARNING: (message) => {
        console.warn(message);
    },
    ERROR: (message) => {
        console.error(message);
    },
};

const REQUEST_OPTIONS: IdleRequestOptions = { timeout: 2000 };
const BATCH_SIZE = 32;

function createLogger(): LogHandler {
    const queue: Item[] = [];
    let requestId = 0;

    return (level, message) => {
        push(level as LogLevel, message, level === 'ERROR');
    };

    function push(kind: LogLevel, message: string, flush: boolean = false): void {
        queue.push({ kind, message });
        if (flush) {
            process(queue.length);
        } else {
            schedule();
        }
    }

    function schedule(): void {
        requestId = requestId || requestIdleCallback(handleIdle, REQUEST_OPTIONS);
    }

    function handleIdle(deadline: IdleDeadline): void {
        requestId = 0;
        while (queue.length > 0) {
            const time = deadline.timeRemaining();
            if (time > 5) {
                process(BATCH_SIZE);
            } else {
                schedule();
                return;
            }
        }
    }

    function process(count: number): void {
        const items = queue.splice(0, count);
        for (const item of items) {
            handlers[item.kind]?.(item.message);
        }
    }
}

export type Disposable = { dispose(): void } | (() => void);

export function disposeAll(disposables: Iterable<Disposable>): void {
    for (const disposable of disposables) {
        if ('dispose' in disposable) {
            disposable.dispose();
        } else {
            disposable();
        }
    }
}

export type Changeble = EventProxy | { changed(): EventProxy } | { readonly changed: EventProxy };

export function renderOnChange(
    runtime: Runtime,
    targets: Iterable<Changeble>,
): () => void {
    for (const changeable of targets) {
        proxy(changeable).on(update);
    }

    return () => {
        for (const changeable of targets) {
            proxy(changeable).off(update);
        }
    };

    function proxy(target: Changeble): EventProxy {
        if ('changed' in target) {
            return typeof target.changed === 'function' ? target.changed() : target.changed;
        }
        return target;
    }

    function update(): void {
        runtime.requestFrameRender();
    }
}
