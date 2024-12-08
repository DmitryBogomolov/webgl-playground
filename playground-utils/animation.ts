import type { Runtime } from 'lib';
import type { Observable } from './observable';
import { observable } from './observable';

export function animation(runtime: Runtime): Observable<boolean> {
    const value = observable(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { dispose: originalDispose } = value;
    value.dispose = dispose;
    value.on(handleChange);

    const button = document.createElement('button');
    button.className = 'btn animation-button';
    const inner = document.createElement('i');
    inner.className = 'fa fa-solid fa-pause';
    button.appendChild(inner);
    setIconClass();

    button.addEventListener('click', () => {
        value(!value());
        setIconClass();
    });
    runtime.canvas().parentElement!.appendChild(button);

    return value;

    function setIconClass(): void {
        const val = value();
        let toAdd = '';
        let toRemove = '';
        if (val) {
            toAdd = 'fa-play';
            toRemove = 'fa-pause';
        } else {
            toAdd = 'fa-pause';
            toRemove = 'fa-play';
        }
        inner.classList.add(toAdd);
        inner.classList.remove(toRemove);
    }

    function dispose(this: typeof value): void {
        this.off(handleChange);
        runtime.frameRequested().off(handleFrame);
        originalDispose.call(this);
        button.remove();
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
