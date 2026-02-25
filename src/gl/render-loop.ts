import type { RenderLoopEvent, RenderLoopEventProxy } from './render-loop.types';
import { EventEmitter } from '../common/event-emitter';

export class RenderLoop {
    // (delta: number, timestamp: number) => void
    private readonly _frameRequested = new EventEmitter<[RenderLoopEvent]>();
    private readonly _handleFrame: FrameRequestCallback = (timestamp) => {
        this._requestId = 0;
        const e = _event_scratch;
        e.delta = (timestamp - this._timestamp) || 0; // ms
        e.timestamp = timestamp;
        this._timestamp = timestamp;
        this._frameRequested.emit(e);
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

    frameRequested(): RenderLoopEventProxy {
        return this._frameRequested.proxy();
    }

    reset(): void {
        this.cancel();
        this._frameRequested.reset();
    }
}

const _event_scratch = { delta: 0, timestamp: 0 };
