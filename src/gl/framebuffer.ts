import type { FramebufferParams, FRAMEBUFFER_ATTACHMENT, FramebufferRuntime } from './framebuffer.types';
import type { RenderTarget } from './render-target.types';
import type { TEXTURE_FORMAT, TextureParameters, TextureRuntime } from './texture-2d.types';
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

const COLOR_TEXTURE_PARAMS: TextureParameters = {};
const DEPTH_TEXTURE_PARAMS: TextureParameters = {
    mag_filter: 'nearest',
    min_filter: 'nearest',
};
const DEPTH_STENCIL_TEXTURE_PARAMS: TextureParameters = {
    mag_filter: 'nearest',
    min_filter: 'nearest',
};

interface AttachmentInfo {
    texture: Texture;
    depthTexture: Texture | null;
    renderbuffer: Renderbuffer | null;
}

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
            const info = this._setup(params.attachment, params.size, !!params.useDepthTexture);
            this._texture = info.texture;
            this._depthTexture = info.depthTexture;
            this._renderbuffer = info.renderbuffer;
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

    private _attachTexture(format: TEXTURE_FORMAT, params: TextureParameters, attachment: number): Texture {
        const texture = new Texture({ runtime: this._runtime as unknown as TextureRuntime });
        this._disposableCtx.add(texture);
        texture.setFormat(format);
        texture.setParameters(params);
        attachTexture(this._runtime, attachment, texture);
        resizeTexture(texture, this._size);
        return texture;
    }

    private _attachRenderbuffer(format: number, attachment: number): Renderbuffer {
        const renderbuffer = new Renderbuffer(this._runtime, this._id, format);
        this._disposableCtx.add(renderbuffer);
        attachRenderbuffer(this._runtime, attachment, renderbuffer);
        resizeRenderbuffer(renderbuffer, this._size);
        return renderbuffer;
    }

    private _setupColor(): AttachmentInfo {
        const texture = this._attachTexture('rgba', COLOR_TEXTURE_PARAMS, GL_COLOR_ATTACHMENT0);
        return {
            texture,
            depthTexture: null,
            renderbuffer: null,
        };
    }

    private _setupColorDepth(useDepthTexture: boolean): AttachmentInfo {
        const info = this._setupColor();
        const depthTexture = useDepthTexture
            ? this._attachTexture('depth_component32', DEPTH_TEXTURE_PARAMS, GL_DEPTH_ATTACHMENT) : null;
        const renderbuffer = useDepthTexture
            ? null : this._attachRenderbuffer(GL_DEPTH_COMPONENT16, GL_DEPTH_ATTACHMENT);
        return {
            ...info,
            depthTexture,
            renderbuffer,
        };
    }

    private _setupColorDepthStencil(useDepthTexture: boolean): AttachmentInfo {
        const info = this._setupColor();
        const depthTexture = useDepthTexture
            ? this._attachTexture('depth_stencil', DEPTH_STENCIL_TEXTURE_PARAMS, GL_DEPTH_STENCIL_ATTACHMENT) : null;
        const renderbuffer = useDepthTexture
            ? null : this._attachRenderbuffer(GL_DEPTH_STENCIL, GL_DEPTH_STENCIL_ATTACHMENT);
        return {
            ...info,
            depthTexture,
            renderbuffer,
        };
    }

    private _setup(attachment: FRAMEBUFFER_ATTACHMENT, size: Vec2, useDepthTexture: boolean): AttachmentInfo {
        this._logInfo(`setup_attachment(${attachment}, ${size.x}x${size.y})`);
        this._size = clone2(size);
        let info: AttachmentInfo;
        try {
            this._runtime.bindFramebuffer(this);
            switch (attachment) {
            case 'color':
                info = this._setupColor();
                break;
            case 'color|depth':
                info = this._setupColorDepth(useDepthTexture);
                break;
            case 'color|depth|stencil':
                info = this._setupColorDepthStencil(useDepthTexture);
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
        return info;
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
    // Binding is actually meaningless. Just for similarity with renderbuffer part.
    try {
        runtime.bindTexture(texture);
        runtime.gl().framebufferTexture2D(GL_FRAMEBUFFER, attachment, GL_TEXTURE_2D, texture.glHandle(), 0);
    } finally {
        runtime.bindTexture(null);
    }
}

function attachRenderbuffer(runtime: FramebufferRuntime, attachment: number, renderbuffer: Renderbuffer): void {
    // Binding is actually meaningless (because renderbuffer handle is passed). But without it there is warning.
    try {
        runtime.bindRenderbuffer(renderbuffer);
        runtime.gl().framebufferRenderbuffer(GL_FRAMEBUFFER, attachment, GL_RENDERBUFFER, renderbuffer.glHandle());
    } finally {
        runtime.bindRenderbuffer(null);
    }
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
