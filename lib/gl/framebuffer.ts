import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { Runtime } from './runtime';
import { Texture } from './texture';

const GL_FRAMEBUFFER = WebGLRenderingContext.prototype.FRAMEBUFFER;
const GL_COLOR_ATTACHMENT0 = WebGLRenderingContext.prototype.COLOR_ATTACHMENT0;
const GL_TEXTURE_2D = WebGLRenderingContext.prototype.TEXTURE_2D;

export class Framebuffer {
    private readonly _id = generateId('FrameBuffer');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime;
    private readonly _framebuffer: WebGLFramebuffer;

    constructor(runtime: Runtime) {
        this._logger.log('init');
        this._runtime = runtime;
        this._framebuffer = this._createFramebuffer();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl.deleteFramebuffer(this._framebuffer);
    }

    framebuffer(): WebGLFramebuffer {
        return this._framebuffer;
    }

    private _createFramebuffer(): WebGLFramebuffer {
        const framebuffer = this._runtime.gl.createFramebuffer();
        if (!framebuffer) {
            throw this._logger.error('failed to create frame buffer');
        }
        return framebuffer;
    }

    setupAttachments(texture: Texture): void {
        this._logger.log('setup_attachments');
        this._runtime.bindFramebuffer(this._framebuffer, this._id);
        this._runtime.gl.framebufferTexture2D(
            GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture.texture(), 0,
        );
        this._runtime.bindFramebuffer(null, this._id);
    }
}
