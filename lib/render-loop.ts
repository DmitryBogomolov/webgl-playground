import { Logger, generateId } from './utils';

export type RenderFrameCallback = (delta: number, timestamp: number) => void;

export class RenderLoop {
    private readonly _id = generateId('RenderLoop');
    private readonly _logger = new Logger(this._id);
    private readonly _renderFrame: FrameRequestCallback;
    private _requestId = 0;
    private _timestamp = NaN;

    constructor(renderFrame: RenderFrameCallback) {
        this._renderFrame = (timestamp) => {
            // Measured in ms.
            const delta = (timestamp - this._timestamp) || 0;
            this._timestamp = timestamp;
            renderFrame(delta, timestamp);
            this._requestRender();
        };
    }

    private _requestRender(): void {
        this._requestId = requestAnimationFrame(this._renderFrame);
    }

    start(): void {
        this._logger.log('start');
        if (this.isRunning()) {
            this._logger.warn('already running');
        }
        this._timestamp = NaN;
        this._requestRender();
    }

    stop(): void {
        this._logger.log('stop');
        if (!this.isRunning()) {
            this._logger.warn('not running');
        }
        cancelAnimationFrame(this._requestId);
        this._requestId = 0;
    }

    isRunning(): boolean {
        return this._requestId > 0;
    }
}
