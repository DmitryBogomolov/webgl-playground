import type { FramebufferParams, FRAMEBUFFER_ATTACHMENT, FramebufferRuntime } from './framebuffer.types';
import type { RenderTarget } from './render-target.types';
import type { TextureRuntime, TEXTURE_FORMAT } from './texture-2d.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Mapping } from '../common/mapping.types';
import type { Vec2 } from '../geometry/vec2.types';
import { BaseObject } from './base-object';
import { eq2, clone2 } from '../geometry/vec2';
import { wrap } from './gl-handle-wrapper';
import { Texture } from './texture-2d';

const WebGL = WebGLRenderingContext.prototype;

const GL_FRAMEBUFFER = WebGL.FRAMEBUFFER;
const GL_RENDERBUFFER = WebGL.RENDERBUFFER;
const GL_TEXTURE_2D = WebGL.TEXTURE_2D;
const GL_COLOR_ATTACHMENT0 = WebGL.COLOR_ATTACHMENT0;
const GL_DEPTH_ATTACHMENT = WebGL.DEPTH_ATTACHMENT;
const GL_DEPTH_STENCIL_ATTACHMENT = WebGL.DEPTH_STENCIL_ATTACHMENT;
const GL_DEPTH_COMPONENT16 = WebGL.DEPTH_COMPONENT16;
const GL_DEPTH_STENCIL = WebGL.DEPTH_STENCIL;
const GL_FRAMEBUFFER_COMPLETE = WebGL.FRAMEBUFFER_COMPLETE;
const GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = WebGL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT;
const GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = WebGL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT;
const GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = WebGL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS;
const GL_FRAMEBUFFER_UNSUPPORTED = WebGL.FRAMEBUFFER_UNSUPPORTED;

const ERRORS_MAP: Mapping<number, string> = {
    [GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: 'incomplete attachment',
    [GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: 'missing attachment',
    [GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: 'dimensions',
    [GL_FRAMEBUFFER_UNSUPPORTED]: 'unsupported',
};

export class Framebuffer extends BaseObject implements GLHandleWrapper<WebGLFramebuffer>, RenderTarget {
    private readonly _runtime: FramebufferRuntime;
    private readonly _framebuffer: WebGLFramebuffer;
    private readonly _attachment: FRAMEBUFFER_ATTACHMENT;
    private readonly _texture: Texture;
    private readonly _depthTexture: Texture | null;
    private readonly _renderbuffer: WebGLRenderbuffer | null;
    private _size!: Vec2;

    constructor(params: FramebufferParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._logger.info('init');
        this._runtime = params.runtime;
        this._framebuffer = this._createFramebuffer();
        const {
            texture, depthTexture, renderbuffer,
        } = this._setup(params.attachment, params.size, params.useDepthTexture);
        this._attachment = params.attachment;
        this._texture = texture;
        this._depthTexture = depthTexture;
        this._renderbuffer = renderbuffer;
    }

    dispose(): void {
        this._logger.info('dispose');
        if (this._texture) {
            this._texture.dispose();
        }
        if (this._depthTexture) {
            this._depthTexture.dispose();
        }
        if (this._renderbuffer) {
            this._runtime.gl().deleteRenderbuffer(this._renderbuffer);
        }
        this._runtime.gl().deleteFramebuffer(this._framebuffer);
        this._dispose();
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

    depthTexture(): Texture | null {
        return this._depthTexture;
    }

    private _createFramebuffer(): WebGLFramebuffer {
        const framebuffer = this._runtime.gl().createFramebuffer();
        if (!framebuffer) {
            throw this._logError('failed to create framebuffer');
        }
        return framebuffer;
    }

    private _createRenderbuffer(): WebGLRenderbuffer {
        const renderbuffer = this._runtime.gl().createRenderbuffer();
        if (!renderbuffer) {
            throw this._logError('failed to create renderbuffer');
        }
        return renderbuffer;
    }

    private _attachTexture(): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        resizeColorTexture(texture, this._size);
        this._runtime.gl().framebufferTexture2D(
            GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture.glHandle(), 0,
        );
        return texture;
    }

    private _attachDepthTexture(): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        texture.setImageData({ size: this._size, data: null }, { format: 'depth_component32' });
        texture.setParameters({
            mag_filter: 'nearest',
            min_filter: 'nearest',
        });
        resizeDepthTexture(texture, this._size);
        this._runtime.gl().framebufferTexture2D(
            GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, texture.glHandle(), 0,
        );
        return texture;
    }

    private _attachDepthBuffer(): WebGLRenderbuffer {
        const renderbuffer = this._createRenderbuffer();
        try {
            this._runtime.bindRenderbuffer(wrap(this._id, renderbuffer));
            resizeDepthRenderbuffer(this._runtime, this._size);
            this._runtime.gl().framebufferRenderbuffer(
                GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, renderbuffer,
            );
        } finally {
            this._runtime.bindRenderbuffer(null);
        }
        return renderbuffer;
    }

    private _attachDepthStencilTexture(): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        texture.setParameters({
            mag_filter: 'nearest',
            min_filter: 'nearest',
        });
        resizeDepthStencilTexture(texture, this._size);
        this._runtime.gl().framebufferTexture2D(
            GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_TEXTURE_2D, texture.glHandle(), 0,
        );
        return texture;
    }

    private _attachDepthStencilBuffer(): WebGLRenderbuffer {
        const renderbuffer = this._createRenderbuffer();
        try {
            this._runtime.bindRenderbuffer(wrap(this._id, renderbuffer));
            resizeDepthStencilRenderbuffer(this._runtime, this._size);
            this._runtime.gl().framebufferRenderbuffer(
                GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, renderbuffer,
            );
        } finally {
            this._runtime.bindRenderbuffer(null);
        }
        return renderbuffer;
    }

    private _setup(attachment: FRAMEBUFFER_ATTACHMENT, size: Vec2, useDepthTexture?: boolean): {
        texture: Texture,
        depthTexture: Texture | null,
        renderbuffer: WebGLFramebuffer | null,
    } {
        this._logger.info('setup_attachment({0}, {1}x{2})', attachment, size.x, size.y);
        this._size = size;
        let texture!: Texture;
        let depthTexture: Texture | null = null;
        let renderbuffer: WebGLRenderbuffer | null = null;
        try {
            this._runtime.bindFramebuffer(this);
            switch (attachment) {
            case 'color':
                texture = this._attachTexture();
                break;
            case 'color|depth':
                texture = this._attachTexture();
                if (useDepthTexture) {
                    depthTexture = this._attachDepthTexture();
                } else {
                    renderbuffer = this._attachDepthBuffer();
                }
                break;
            case 'color|depth|stencil':
                texture = this._attachTexture();
                if (useDepthTexture) {
                    depthTexture = this._attachDepthStencilTexture();
                } else {
                    renderbuffer = this._attachDepthStencilBuffer();
                }
                break;
            default:
                throw this._logError(`bad attachment type: ${attachment}`);
                break;
            }
            const status = this._runtime.gl().checkFramebufferStatus(GL_FRAMEBUFFER);
            if (status !== GL_FRAMEBUFFER_COMPLETE) {
                throw this._logError(`failed to setup attachment: ${ERRORS_MAP[status]}`);
            }
        } finally {
            this._runtime.bindFramebuffer(null);
        }
        return { texture, depthTexture, renderbuffer };
    }

    resize(size: Vec2): void {
        if (eq2(this._size, size)) {
            return;
        }
        this._size = clone2(size);
        this._logger.info('resize({0})', size);
        resizeColorTexture(this._texture, size);
        if (this._depthTexture) {
            switch (this._attachment) {
            case 'color|depth':
                resizeDepthTexture(this._texture, size);
                break;
            case 'color|depth|stencil':
                resizeDepthStencilTexture(this._texture, size);
                break;
            }
        }
        if (this._renderbuffer) {
            try {
                this._runtime.bindRenderbuffer(wrap(this._id, this._renderbuffer));
                switch (this._attachment) {
                case 'color|depth':
                    resizeDepthRenderbuffer(this._runtime, size);
                    break;
                case 'color|depth|stencil':
                    resizeDepthStencilRenderbuffer(this._runtime, size);
                    break;
                }
            } finally {
                this._runtime.bindRenderbuffer(null);
            }
        }
    }
}

function resizeTexture(texture: Texture, size: Vec2, format: TEXTURE_FORMAT): void {
    texture.setImageData({ size, data: null }, { format });
}

function resizeColorTexture(texture: Texture, size: Vec2): void {
    resizeTexture(texture, size, 'rgba');
}

function resizeDepthTexture(texture: Texture, size: Vec2): void {
    resizeTexture(texture, size, 'depth_component32');
}

function resizeDepthStencilTexture(texture: Texture, size: Vec2): void {
    resizeTexture(texture, size, 'depth_stencil');
}

function resizeRenderbuffer(runtime: FramebufferRuntime, size: Vec2, format: number): void {
    runtime.gl().renderbufferStorage(GL_RENDERBUFFER, format, size.x, size.y);
}

function resizeDepthRenderbuffer(runtime: FramebufferRuntime, size: Vec2): void {
    resizeRenderbuffer(runtime, size, GL_DEPTH_COMPONENT16);
}

function resizeDepthStencilRenderbuffer(runtime: FramebufferRuntime, size: Vec2): void {
    resizeRenderbuffer(runtime, size, GL_DEPTH_STENCIL);
}
