import type { Runtime } from 'lib';

export function trackSize(runtime: Runtime, callback: () => void): () => void {
    runtime.renderSizeChanged().on(callback);
    return () => {
        runtime.renderSizeChanged().off(callback);
    };
}
