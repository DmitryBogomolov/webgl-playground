export class RenderLoop {
    constructor(renderFrame) {
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
        this._requestRender();
    }

    stop() {
        cancelAnimationFrame(this._requestId);
        this._requestId = 0;
    }

    isRunning() {
        return this._requestId > 0;
    }
}
