import type { FramebufferParams, FRAMEBUFFER_ATTACHMENT, FramebufferRuntime } from './framebuffer.types';
import type { RenderTarget } from './render-target.types';
import type { TextureRuntime } from './texture-2d.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Mapping } from '../common/mapping.types';
import type { Vec2 } from '../geometry/vec2.types';
import { BaseObject } from './base-object';
import { vec2, eq2, clone2 } from '../geometry/vec2';
import { Texture } from './texture-2d';
import { DisposableContext } from '../utils/disposable-context';

const WebGL = WebGLRenderingContext.prototype;

const {
    FRAMEBUFFER: GL_FRAMEBUFFER,
    RENDERBUFFER: GL_RENDERBUFFER,
    TEXTURE_2D: GL_TEXTURE_2D,
    COLOR_ATTACHMENT0: GL_COLOR_ATTACHMENT0,
    DEPTH_ATTACHMENT: GL_DEPTH_ATTACHMENT,
    DEPTH_STENCIL_ATTACHMENT: GL_DEPTH_STENCIL_ATTACHMENT,
    DEPTH_COMPONENT16: GL_DEPTH_COMPONENT16,
    DEPTH_STENCIL: GL_DEPTH_STENCIL,
    FRAMEBUFFER_COMPLETE: GL_FRAMEBUFFER_COMPLETE,
} = WebGL;

const ERRORS_MAP: Mapping<number, string> = {
    [WebGL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: 'incomplete attachment',
    [WebGL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: 'missing attachment',
    [WebGL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: 'dimensions',
    [WebGL.FRAMEBUFFER_UNSUPPORTED]: 'unsupported',
};

export class Framebuffer extends BaseObject implements GLHandleWrapper<WebGLFramebuffer>, RenderTarget {
    private readonly _runtime: FramebufferRuntime;
    private readonly _disposableCtx = new DisposableContext();
    private readonly _framebuffer: WebGLFramebuffer;
    private readonly _texture: Texture;
    private readonly _depthTexture: Texture | null;
    private readonly _renderbuffer: Renderbuffer | null;
    private _size: Vec2 = vec2(0, 0);

    constructor(params: FramebufferParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._logInfo('init');
        this._runtime = params.runtime;
        try {
            this._framebuffer = this._createFramebuffer();
            const {
                texture, depthTexture, renderbuffer,
            } = this._setup(params.attachment, params.size, !!params.useDepthTexture);
            this._texture = texture;
            this._depthTexture = depthTexture;
            this._renderbuffer = renderbuffer;
        } catch (err) {
            this._disposableCtx.dispose();
            throw this._logError(err as Error);
        }
    }

    dispose(): void {
        this._logInfo('dispose');
        this._disposableCtx.dispose();
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
        const gl = this._runtime.gl();
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
            throw new Error('failed to create framebuffer');
        }
        function dispose(): void {
            gl.deleteFramebuffer(framebuffer);
        }
        this._disposableCtx.add({ dispose });
        return framebuffer;
    }

    private _attachTexture(): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        this._disposableCtx.add(texture);
        texture.setFormat('rgba');
        attachTexture(this._runtime, GL_COLOR_ATTACHMENT0, texture);
        resizeTexture(texture, this._size);
        return texture;
    }

    private _attachDepthTexture(): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        this._disposableCtx.add(texture);
        texture.setFormat('depth_component32');
        texture.setParameters({
            mag_filter: 'nearest',
            min_filter: 'nearest',
        });
        attachTexture(this._runtime, GL_DEPTH_ATTACHMENT, texture);
        resizeTexture(texture, this._size);
        return texture;
    }

    private _attachDepthBuffer(): Renderbuffer {
        const renderbuffer = new Renderbuffer(this._runtime, this._id, GL_DEPTH_COMPONENT16);
        this._disposableCtx.add(renderbuffer);
        attachRenderbuffer(this._runtime, GL_DEPTH_ATTACHMENT, renderbuffer);
        resizeRenderbuffer(renderbuffer, this._size);
        return renderbuffer;
    }

    private _attachDepthStencilTexture(): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        this._disposableCtx.add(texture);
        texture.setFormat('depth_stencil');
        texture.setParameters({
            mag_filter: 'nearest',
            min_filter: 'nearest',
        });
        attachTexture(this._runtime, GL_DEPTH_STENCIL_ATTACHMENT, texture);
        resizeTexture(texture, this._size);
        return texture;
    }

    private _attachDepthStencilBuffer(): Renderbuffer {
        const renderbuffer = new Renderbuffer(this._runtime, this._id, GL_DEPTH_STENCIL);
        this._disposableCtx.add(renderbuffer);
        attachRenderbuffer(this._runtime, GL_DEPTH_STENCIL_ATTACHMENT, renderbuffer);
        resizeRenderbuffer(renderbuffer, this._size);
        return renderbuffer;
    }

    private _setup(attachment: FRAMEBUFFER_ATTACHMENT, size: Vec2, useDepthTexture: boolean): {
        texture: Texture,
        depthTexture: Texture | null,
        renderbuffer: Renderbuffer | null,
    } {
        this._logInfo(`setup_attachment(${attachment}, ${size.x}x${size.y})`);
        this._size = clone2(size);
        let texture: Texture;
        let depthTexture: Texture | null = null;
        let renderbuffer: Renderbuffer | null = null;
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
                throw new Error(`bad attachment type: ${attachment}`);
            }
            const status = this._runtime.gl().checkFramebufferStatus(GL_FRAMEBUFFER);
            if (status !== GL_FRAMEBUFFER_COMPLETE) {
                throw new Error(`failed to setup attachment: ${ERRORS_MAP[status]}`);
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
        this._logInfo(`resize(width=${size.x}, height=${size.y})`);
        resizeTexture(this._texture, size);
        if (this._depthTexture) {
            resizeTexture(this._depthTexture, size);
        }
        if (this._renderbuffer) {
            resizeRenderbuffer(this._renderbuffer, size);
        }
    }
}

function resizeTexture(texture: Texture, size: Vec2): void {
    texture.setImageData({ size, data: null });
}

function resizeRenderbuffer(renderbuffer: Renderbuffer, size: Vec2): void {
    renderbuffer.resize(size);
}

function attachTexture(runtime: FramebufferRuntime, attachment: number, texture: Texture): void {
    runtime.gl().framebufferTexture2D(GL_FRAMEBUFFER, attachment, GL_TEXTURE_2D, texture.glHandle(), 0);
}

function attachRenderbuffer(runtime: FramebufferRuntime, attachment: number, renderbuffer: Renderbuffer): void {
    runtime.gl().framebufferRenderbuffer(GL_FRAMEBUFFER, attachment, GL_RENDERBUFFER, renderbuffer.glHandle());
}

class Renderbuffer implements GLHandleWrapper<WebGLRenderbuffer> {
    private readonly _runtime: FramebufferRuntime;
    private readonly _id: string;
    private readonly _format: number;
    private readonly _renderbuffer: WebGLRenderbuffer;

    constructor(runtime: FramebufferRuntime, id: string, format: number) {
        this._runtime = runtime;
        this._id = id;
        this._format = format;
        const renderbuffer = this._runtime.gl().createRenderbuffer();
        if (!renderbuffer) {
            throw new Error('failed to create renderbuffer');
        }
        this._renderbuffer = renderbuffer;
    }

    dispose(): void {
        this._runtime.gl().deleteRenderbuffer(this._renderbuffer);
    }

    toString(): string {
        return this._id;
    }

    glHandle(): WebGLRenderbuffer {
        return this._renderbuffer;
    }

    resize(size: Vec2): void {
        try {
            this._runtime.bindRenderbuffer(this);
            this._runtime.gl().renderbufferStorage(GL_RENDERBUFFER, this._format, size.x, size.y);
        } finally {
            this._runtime.bindRenderbuffer(null);
        }
    }
}
