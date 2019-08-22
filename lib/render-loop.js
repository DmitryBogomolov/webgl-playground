import { idMixin } from './id-mixin';

export class RenderLoop {
    constructor(renderFrame) {
        this._setupId();
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
        this._log('start');
        if (this.isRunning()) {
            this._error(new Error('already running'));
        }
        this._requestRender();
    }

    stop() {
        this._log('stop');
        if (!this.isRunning()) {
            this._error(new Error('not running'));
        }
        cancelAnimationFrame(this._requestId);
        this._requestId = 0;
    }

    isRunning() {
        return this._requestId > 0;
    }
}

RenderLoop.prototype._idPrefix = 'RenderLoop';
idMixin(RenderLoop);
