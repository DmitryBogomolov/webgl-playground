import type { Vec2 } from '../geometry/vec2.types';
import { vec2 } from '../geometry/vec2';

// TODO_THIS: Tests
export function trackElementResizing(element: Element, callback: (v: Vec2) => void): () => void {
    const observer = new ResizeObserver((entries) => {
        const size = getObservedSize(entries[0]);
        callback(size);
    });
    observer.observe(element, { box: 'content-box' });
    return () => {
        observer.disconnect();
    };
}

function getObservedSize(entry: ResizeObserverEntry): Vec2 {
    let width: number;
    let height: number;
    let dpr: number;
    if (entry.devicePixelContentBoxSize) {
        const boxSize = entry.devicePixelContentBoxSize[0];
        width = boxSize.inlineSize;
        height = boxSize.blockSize;
        dpr = 1;
    } else if (entry.contentBoxSize) {
        const boxSize = entry.contentBoxSize[0] ?? entry.contentBoxSize;
        width = boxSize.inlineSize;
        height = boxSize.blockSize;
        dpr = devicePixelRatio;
    } else {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        dpr = devicePixelRatio;
    }
    return vec2(Math.round(width * dpr), Math.round(height * dpr));
}
