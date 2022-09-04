import { EventEmitter, EventProxy } from '../utils/event-emitter';

// export type RenderFrameCallback = (delta: number, timestamp: number) => void;

export class RenderLoop {
    private readonly _frameRendered = new EventEmitter<[number, number]>(() => {
        this.update();
    });
    private readonly _renderFrame: FrameRequestCallback = (timestamp) => {
        this._requestId = 0;
        const delta = (timestamp - this._timestamp) || 0; // ms
        this._timestamp = timestamp;
        this._frameRendered.emit(delta, timestamp);
    };
    private _requestId = 0;
    private _timestamp = NaN;

    update(): void {
        this._requestId = this._requestId || requestAnimationFrame(this._renderFrame);
    }

    cancel(): void {
        if (this._requestId > 0) {
            cancelAnimationFrame(this._requestId);
            this._requestId = 0;
        }
    }

    frameRendered(): EventProxy<[number, number]> {
        return this._frameRendered.proxy();
    }

    clearRenderCallbacks(): void {
        this._frameRendered.clear();
    }
}
