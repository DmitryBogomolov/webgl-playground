import { CancelSubscriptionCallback } from './utils';

export type RenderFrameCallback = (delta: number, timestamp: number) => void;

export class RenderLoop {
    private readonly _renderFrame: FrameRequestCallback = (timestamp) => {
        this._requestId = 0;
        const delta = (timestamp - this._timestamp) || 0; // ms
        this._timestamp = timestamp;
        for (const callback of this._callbacks) {
            callback(delta, timestamp);
        }
    };
    private readonly _callbacks: RenderFrameCallback[] = [];
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
        const i = this._callbacks.indexOf(callback);
        if (i < 0) {
            this._callbacks.push(callback);
            this.update();
        }
        return () => {
            const i = this._callbacks.indexOf(callback);
            if (i >= 0) {
                this._callbacks.splice(i, 1);
                this.update();
            }
        };
    }
}
