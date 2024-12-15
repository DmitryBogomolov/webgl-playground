import type { Logger, RuntimeParams } from 'lib';
import { Runtime } from 'lib';

export function setup(params?: Partial<RuntimeParams>): { runtime: Runtime, container: HTMLElement } {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime({
        element: container,
        logger: createLogger(),
        ...params,
    });
    return { runtime, container };
}

function createLogger(): Logger {
    return {
        info(message) {
            console.log(message);
        },

        warn(message) {
            console.warn(message);
        },

        error(message) {
            console.error(message);
        },
    };
}
