import { CancelSubscriptionCallback } from '../utils/cancel-subscription-callback';
import { EventEmitter } from '../utils/event-emitter';

export type RenderFrameCallback = (delta: number, timestamp: number) => void;

export class RenderLoop {
    private readonly _frameRendered = new EventEmitter<Parameters<RenderFrameCallback>>();
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

    onRender(callback: RenderFrameCallback): CancelSubscriptionCallback {
        this.update();
        return this._frameRendered.on(callback);
    }

    clearRenderCallbacks(): void {
        this._frameRendered.clear();
    }
}
