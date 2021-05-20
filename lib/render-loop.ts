export type RenderFrameCallback = (delta: number, timestamp: number) => void;

export class RenderLoop {
    private readonly _renderFrame: FrameRequestCallback;
    private _requestId = 0;
    private _timestamp = NaN;

    constructor(renderFrame: RenderFrameCallback) {
        this._renderFrame = (timestamp) => {
            this._requestId = 0;
            const delta = (timestamp - this._timestamp) || 0; // ms
            this._timestamp = timestamp;
            renderFrame(delta, timestamp);
        };
    }

    update(): void {
        this._requestId = this._requestId || requestAnimationFrame(this._renderFrame);
    }

    cancel(): void {
        if (this._requestId > 0) {
            cancelAnimationFrame(this._requestId);
            this._requestId = 0;
        }
    }
}
