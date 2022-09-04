import { Vec2, ZERO2 } from '../geometry/vec2';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { Runtime } from './runtime';
import { Texture } from './texture';

const GL_FRAMEBUFFER = WebGLRenderingContext.prototype.FRAMEBUFFER;
const GL_RENDERBUFFER = WebGLRenderingContext.prototype.RENDERBUFFER;
const GL_TEXTURE_2D = WebGLRenderingContext.prototype.TEXTURE_2D;
const GL_COLOR_ATTACHMENT0 = WebGLRenderingContext.prototype.COLOR_ATTACHMENT0;
const GL_DEPTH_ATTACHMENT = WebGLRenderingContext.prototype.DEPTH_ATTACHMENT;
const GL_DEPTH_STENCIL_ATTACHMENT = WebGLRenderingContext.prototype.DEPTH_STENCIL_ATTACHMENT;
const GL_DEPTH_COMPONENT16 = WebGLRenderingContext.prototype.DEPTH_COMPONENT16;
const GL_DEPTH_STENCIL = WebGLRenderingContext.prototype.DEPTH_STENCIL;

export type FRAMEBUFFER_ATTACHMENT = ('color' | 'color|depth' | 'color|depth|stencil');

export class Framebuffer {
    private readonly _id = generateId('FrameBuffer');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime;
    private readonly _framebuffer: WebGLFramebuffer;
    private _texture: Texture | null = null;
    private _renderbuffer: WebGLRenderbuffer | null = null;

    constructor(runtime: Runtime) {
        this._logger.log('init');
        this._runtime = runtime;
        this._framebuffer = this._createFramebuffer();
    }

    dispose(): void {
        this._logger.log('dispose');
        if (this._renderbuffer) {
            this._runtime.gl.deleteRenderbuffer(this._renderbuffer);
        }
        this._runtime.gl.deleteFramebuffer(this._framebuffer);
    }

    framebuffer(): WebGLFramebuffer {
        return this._framebuffer;
    }

    size(): Vec2 {
        return this._texture ? this._texture.size() : ZERO2;
    }

    private _createFramebuffer(): WebGLFramebuffer {
        const framebuffer = this._runtime.gl.createFramebuffer();
        if (!framebuffer) {
            throw this._logger.error('failed to create framebuffer');
        }
        return framebuffer;
    }

    private _createRenderbuffer(): WebGLRenderbuffer {
        const renderbuffer = this._runtime.gl.createRenderbuffer();
        if (!renderbuffer) {
            throw this._logger.error('failed to create renderbuffer');
        }
        return renderbuffer;
    }

    private _attachTexture(texture: Texture): void {
        this._runtime.gl.framebufferTexture2D(
            GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture.texture(), 0,
        );
        this._texture = texture;
    }

    private _attachDepthBuffer({ x, y }: Vec2): void {
        const renderbuffer = this._createRenderbuffer();
        try {
            this._runtime.bindRenderbuffer(renderbuffer, this._id);
            this._runtime.gl.renderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, x, y);
            this._runtime.gl.framebufferRenderbuffer(
                GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, renderbuffer,
            );
        } finally {
            this._runtime.bindRenderbuffer(null, this._id);
        }
        this._renderbuffer = renderbuffer;
    }

    private _attachDepthStencilBuffer({ x, y }: Vec2): void {
        const renderbuffer = this._createRenderbuffer();
        try {
            this._runtime.bindRenderbuffer(renderbuffer, this._id);
            this._runtime.gl.renderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_STENCIL, x, y);
            this._runtime.gl.framebufferRenderbuffer(
                GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, renderbuffer,
            );
        } finally {
            this._runtime.bindRenderbuffer(null, this._id);
        }
        this._renderbuffer = renderbuffer;
    }

    setupAttachment(type: FRAMEBUFFER_ATTACHMENT, texture: Texture): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        this._logger.log('setup_attachment({0}, {1})', type, (texture as any)._id);
        this._texture = null;
        if (this._renderbuffer) {
            this._runtime.gl.deleteRenderbuffer(this._renderbuffer);
        }
        this._renderbuffer = null;
        try {
            this._runtime.bindFramebuffer(this._framebuffer, this._id);
            switch (type) {
            case 'color':
                this._attachTexture(texture);
                break;
            case 'color|depth':
                this._attachTexture(texture);
                this._attachDepthBuffer(texture.size());
                break;
            case 'color|depth|stencil':
                this._attachTexture(texture);
                this._attachDepthStencilBuffer(texture.size());
                break;
            default:
                this._logger.error('bad attachment type: {0}', type);
                break;
            }
        } finally {
            this._runtime.bindFramebuffer(null, this._id);
        }
    }
}
