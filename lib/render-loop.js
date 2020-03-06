import { Logger, generateId } from './utils';

export class RenderLoop {
    constructor(/** @type {() => {}} */renderFrame) {
        this._logger = new Logger(generateId('RenderLoop'));
        this._requestId = 0;
        this._renderFrame = () => {
            renderFrame();
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
