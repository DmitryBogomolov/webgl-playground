import type { RenderLoopEvent, RenderLoopEventProxy } from './render-loop.types';
import { EventEmitter } from '../common/event-emitter';

export class RenderLoop {
    private readonly _frameRequested = new EventEmitter<[RenderLoopEvent]>();
    private _requestId: number = 0;
    private _timestamp: number = NaN;

    private readonly _handleFrame: FrameRequestCallback = (timestamp) => {
        this._requestId = 0;
        const e = _event_scratch;
        e.delta = (timestamp - this._timestamp) || 0; // ms
        e.timestamp = timestamp;
        this._timestamp = timestamp;
        this._frameRequested.emit(e);
    };

    update(): void {
        this._requestId = this._requestId || requestAnimationFrame(this._handleFrame);
    }

    cancel(): void {
        if (this._requestId > 0) {
            cancelAnimationFrame(this._requestId);
            this._requestId = 0;
        }
    }

    get frameRequested(): RenderLoopEventProxy {
        return this._frameRequested.proxy;
    }

    reset(): void {
        this.cancel();
        this._frameRequested.reset();
    }
}

const _event_scratch = { delta: 0, timestamp: 0 };
