import type { Runtime } from 'lib';
import type { Observable } from './observable';
import { observable } from './observable';

const ICON_SIZE = 16;

export function animation(runtime: Runtime): Observable<boolean> {
    const value = observable(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { dispose: originalDispose } = value;
    value.dispose = dispose;

    const button = document.createElement('button');
    button.className = 'btn animation-button';
    const img = document.createElement('img');
    img.width = ICON_SIZE;
    img.height = ICON_SIZE;
    button.appendChild(img);
    button.addEventListener('click', () => {
        value(!value());
    });
    runtime.canvas().parentElement!.appendChild(button);

    value.on(handleChange);
    value.on(setIconClass);
    return value;

    function setIconClass(): void {
        const val = value();
        img.src = `/static/${val ? 'play' : 'pause'}-solid.svg`;
    }

    function dispose(this: typeof value): void {
        this.off(handleChange);
        this.off(setIconClass);
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
