import { EventEmitter } from './event-emitter';
import { throttle } from './throttler';

const emitter = new EventEmitter();
const index = new Map<() => void, () => void>();

function handleResize(): void {
    emitter.emit();
}

export function onWindowResize(callback: () => void, timespan: number = 250): void {
    if (emitter.count() === 0) {
        window.addEventListener('resize', handleResize);
    }
    const listener = throttle(callback, timespan);
    emitter.on(listener);
    index.set(callback, listener);
}

export function offWindowResize(callback: () => void): void {
    const listener = index.get(callback);
    if (!listener) {
        return;
    }
    index.delete(callback);
    emitter.off(listener);
    if (emitter.count() === 0) {
        window.removeEventListener('resize', handleResize);
    }
}
