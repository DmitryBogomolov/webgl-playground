import type { Runtime } from 'lib';

export function trackSize(runtime: Runtime, callback: () => void): () => void {
    runtime.sizeChanged().on(callback);
    callback();
    return () => {
        runtime.sizeChanged().off(callback);
    };
}
