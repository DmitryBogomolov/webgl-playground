import type { Logger, RuntimeParams } from 'lib';
import { Runtime } from 'lib';
import { hasUrlParam } from './url';

export function setup(params?: Partial<RuntimeParams>): { runtime: Runtime, container: HTMLElement } {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const logger = !hasUrlParam('no-logger') ? createLogger() : undefined;
    const runtime = new Runtime({
        element: container,
        logger,
        ...params,
    });
    return { runtime, container };
}

type Kind = 'info' | 'warn' | 'error';

interface Item {
    readonly kind: Kind;
    readonly message: string;
}

const handlers: Readonly<Record<Kind, (message: string) => void>> = {
    info(message) {
        console.info(message);
    },
    warn(message) {
        console.warn(message);
    },
    error(message) {
        console.error(message);
    },
};

const REQUEST_OPTIONS: IdleRequestOptions = { timeout: 2000 };
const BATCH_SIZE = 32;

function createLogger(): Logger {
    const queue: Item[] = [];
    let requestId = 0;

    return {
        info(message) {
            push('info', message);
        },

        warn(message) {
            push('warn', message);
        },

        error(message) {
            push('error', message, true);
        },
    };

    function push(kind: Kind, message: string, flush: boolean = false): void {
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
            handlers[item.kind](item.message);
        }
    }
}

export function disposeAll(disposables: Iterable<{ dispose: () => void } | (() => void)>): void {
    for (const disposable of disposables) {
        if ('dispose' in disposable) {
            disposable.dispose();
        } else {
            disposable();
        }
    }
}
