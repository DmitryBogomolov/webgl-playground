import { Logger, generateId } from './utils';

/**
 * @typedef {(delta: number, timestamp: number) => void} RenderFrameCallback
 */

export class RenderLoop {
    constructor(/** @type {RenderFrameCallback} */renderFrame) {
        this._logger = new Logger(generateId('RenderLoop'));
        this._requestId = 0;
        this._timestamp = NaN;
        this._renderFrame = (/** @type {number} */timestamp) => {
            // Measured in ms.
            const delta = (timestamp - this._timestamp) || 0;
            this._timestamp = timestamp;
            renderFrame(delta, timestamp);
            this._requestRender();
        };
    }

    _requestRender() {
        this._requestId = requestAnimationFrame(this._renderFrame);
    }

    start() {
        this._logger.log('start');
        if (this.isRunning()) {
            this._logger.error('already running');
        }
        this._timestamp = NaN;
        this._requestRender();
    }

    stop() {
        this._logger.log('stop');
        if (!this.isRunning()) {
            this._logger.error('not running');
        }
        cancelAnimationFrame(this._requestId);
        this._requestId = 0;
    }

    isRunning() {
        return this._requestId > 0;
    }
}
