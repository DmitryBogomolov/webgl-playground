import type { EventProxy } from '../common/event-emitter.types';
import { EventEmitter } from '../common/event-emitter';

export class RenderLoop {
    // (delta: number, timestamp: number) => void
    private readonly _frameRequested = new EventEmitter<[number, number]>();
    private readonly _handleFrame: FrameRequestCallback = (timestamp) => {
        this._requestId = 0;
        const delta = (timestamp - this._timestamp) || 0; // ms
        this._timestamp = timestamp;
        this._frameRequested.emit(delta, timestamp);
    };
    private _requestId = 0;
    private _timestamp = NaN;

    update(): void {
        this._requestId = this._requestId || requestAnimationFrame(this._handleFrame);
    }

    cancel(): void {
        if (this._requestId > 0) {
            cancelAnimationFrame(this._requestId);
            this._requestId = 0;
        }
    }

    frameRequested(): EventProxy<[number, number]> {
        return this._frameRequested.proxy();
    }

    clearCallbacks(): void {
        this._frameRequested.clear();
    }
}
