import type { Runtime } from 'lib';
import { observable, bind } from './observable';

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

    const cancel = bind(value, (val) => {
        img.src = `/static/${val ? 'play' : 'pause'}-solid.svg`;
        if (val) {
            runtime.frameRequested().on(handleFrame);
            runtime.requestFrameRender();
        } else {
            runtime.frameRequested().off(handleFrame);
        }
    });

    return () => {
        cancel();
        runtime.frameRequested().off(handleFrame);
        button.remove();
    };

    function handleFrame(): void {
        runtime.requestFrameRender();
    }
}
