import type { Runtime } from 'lib';
import type { Observable } from './observable';
import { observable } from './observable';

export function animation(runtime: Runtime): Observable<boolean> {
    const value = observable(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { dispose: originalDispose } = value;
    value.dispose = dispose;
    value.on(handleChange);

    return value;

    function dispose(this: typeof value): void {
        this.off(handleChange);
        runtime.frameRequested().off(handleFrame);
        originalDispose.call(this);
    }

    function handleChange(val: boolean): void {
        if (val) {
            runtime.frameRequested().on(handleFrame);
            runtime.requestFrameRender();
        } else {
            runtime.frameRequested().off(handleFrame);
        }
    }

    function handleFrame(): void {
        runtime.requestFrameRender();
    }
}
