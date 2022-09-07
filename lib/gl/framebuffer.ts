import { FRAMEBUFFER_ATTACHMENT, FramebufferRuntime } from './types/framebuffer';
import { TextureRuntime } from './types/texture';
import { GLHandleWrapper } from './types/gl-handle-wrapper';
import { BaseWrapper } from './base-wrapper';
import { Vec2 } from '../geometry/types/vec2';
import { ZERO2 } from '../geometry/vec2';
import { wrap } from './gl-handle-wrapper';
import { Texture } from './texture';

const GL_FRAMEBUFFER = WebGLRenderingContext.prototype.FRAMEBUFFER;
const GL_RENDERBUFFER = WebGLRenderingContext.prototype.RENDERBUFFER;
const GL_TEXTURE_2D = WebGLRenderingContext.prototype.TEXTURE_2D;
const GL_COLOR_ATTACHMENT0 = WebGLRenderingContext.prototype.COLOR_ATTACHMENT0;
const GL_DEPTH_ATTACHMENT = WebGLRenderingContext.prototype.DEPTH_ATTACHMENT;
const GL_DEPTH_STENCIL_ATTACHMENT = WebGLRenderingContext.prototype.DEPTH_STENCIL_ATTACHMENT;
const GL_DEPTH_COMPONENT16 = WebGLRenderingContext.prototype.DEPTH_COMPONENT16;
const GL_DEPTH_STENCIL = WebGLRenderingContext.prototype.DEPTH_STENCIL;

export class Framebuffer extends BaseWrapper implements GLHandleWrapper<WebGLFramebuffer> {
    private readonly _runtime: FramebufferRuntime;
    private readonly _framebuffer: WebGLFramebuffer;
    private _size: Vec2 = ZERO2;
    private _texture: Texture | null = null;
    private _depthTexture: Texture | null = null;
    private _renderbuffer: WebGLRenderbuffer | null = null;

    constructor(runtime: FramebufferRuntime, tag?: string) {
        super(tag);
        this._logger.log('init');
        this._runtime = runtime;
        this._framebuffer = this._createFramebuffer();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._dispose();
        this._runtime.gl.deleteFramebuffer(this._framebuffer);
    }

    private _dispose(): void {
        if (this._texture) {
            this._texture.dispose();
            this._texture = null;
        }
        if (this._depthTexture) {
            this._depthTexture.dispose();
            this._depthTexture = null;
        }
        if (this._renderbuffer) {
            this._runtime.gl.deleteRenderbuffer(this._renderbuffer);
            this._renderbuffer = null;
        }
    }

    glHandle(): WebGLFramebuffer {
        return this._framebuffer;
    }

    size(): Vec2 {
        return this._size;
    }

    texture(): Texture | null {
        return this._texture;
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

    private _attachTexture(): void {
        const texture = new Texture(this._runtime as unknown as TextureRuntime);
        texture.setImageData({ size: this._size, data: null }, { format: 'rgba' });
        texture.setParameters({
            wrap_s: 'clamp_to_edge',
            wrap_t: 'clamp_to_edge',
            mag_filter: 'linear',
            min_filter: 'linear',
        });
        this._runtime.gl.framebufferTexture2D(
            GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture.glHandle(), 0,
        );
        this._texture = texture;
    }

    private _attachDepthTexture(): void {
        const texture = new Texture(this._runtime as unknown as TextureRuntime);
        texture.setImageData({ size: this._size, data: null }, { format: 'depth_component32' });
        texture.setParameters({
            wrap_s: 'clamp_to_edge',
            wrap_t: 'clamp_to_edge',
            mag_filter: 'nearest',
            min_filter: 'nearest',
        });
        this._runtime.gl.framebufferTexture2D(
            GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, texture.glHandle(), 0,
        );
        this._depthTexture = texture;
    }

    private _attachDepthBuffer(): void {
        const renderbuffer = this._createRenderbuffer();
        try {
            this._runtime.bindRenderbuffer(wrap(this._id, renderbuffer));
            this._runtime.gl.renderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, this._size.x, this._size.y);
            this._runtime.gl.framebufferRenderbuffer(
                GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, renderbuffer,
            );
        } finally {
            this._runtime.bindRenderbuffer(null);
        }
        this._renderbuffer = renderbuffer;
    }

    private _attachDepthStencilBuffer(): void {
        const renderbuffer = this._createRenderbuffer();
        try {
            this._runtime.bindRenderbuffer(wrap(this._id, renderbuffer));
            this._runtime.gl.renderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_STENCIL, this._size.x, this._size.y);
            this._runtime.gl.framebufferRenderbuffer(
                GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, renderbuffer,
            );
        } finally {
            this._runtime.bindRenderbuffer(null);
        }
        this._renderbuffer = renderbuffer;
    }

    setup(attachment: FRAMEBUFFER_ATTACHMENT, size: Vec2, useDepthTexture?: boolean): void {
        this._logger.log('setup_attachment({0}, {1}x{2})', attachment, size.x, size.y);
        this._dispose();
        this._size = size;
        try {
            this._runtime.bindFramebuffer(this);
            switch (attachment) {
            case 'color':
                this._attachTexture();
                break;
            case 'color|depth':
                this._attachTexture();
                if (useDepthTexture) {
                    this._attachDepthTexture();
                } else {
                    this._attachDepthBuffer();
                }
                break;
            case 'color|depth|stencil':
                this._attachTexture();
                this._attachDepthStencilBuffer();
                break;
            default:
                this._logger.error('bad attachment type: {0}', attachment);
                break;
            }
        } finally {
            this._runtime.bindFramebuffer(null);
        }
    }
}
