import type { Runtime } from 'lib';
import { observable } from './observable';

const ICON_SIZE = 16;

export function animation(runtime: Runtime): () => void {
    const value = observable(true);
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
    handleChange();
    setIconClass();

    return dispose;

    function setIconClass(): void {
        const val = value();
        img.src = `/static/${val ? 'play' : 'pause'}-solid.svg`;
    }

    function dispose(): void {
        value.off(handleChange);
        value.off(setIconClass);
        runtime.frameRequested().off(handleFrame);
        button.remove();
    }

    function handleChange(): void {
        if (value()) {
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
