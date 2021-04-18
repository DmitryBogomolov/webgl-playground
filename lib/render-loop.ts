import { Logger, generateId } from './utils';

type RenderFrameCallback = (delta: number, timestamp: number) => void;

export class RenderLoop {
    private readonly _logger: Logger;
    private _requestId: number;
    private _timestamp: number;
    private readonly _renderFrame: FrameRequestCallback;

    constructor(renderFrame: RenderFrameCallback) {
        this._logger = new Logger(generateId('RenderLoop'));
        this._requestId = 0;
        this._timestamp = NaN;
        this._renderFrame = (timestamp): void => {
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
            this._logger.error('already running');
        }
        this._timestamp = NaN;
        this._requestRender();
    }

    stop(): void {
        this._logger.log('stop');
        if (!this.isRunning()) {
            this._logger.error('not running');
        }
        cancelAnimationFrame(this._requestId);
        this._requestId = 0;
    }

    isRunning(): boolean {
        return this._requestId > 0;
    }
}
