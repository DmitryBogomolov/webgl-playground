import type { FramebufferParams, FRAMEBUFFER_ATTACHMENT, FramebufferRuntime } from './framebuffer.types';
import type { RenderTarget } from './render-target.types';
import type { TEXTURE_FORMAT, TextureParameters, TextureRuntime } from './texture-2d.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Mapping } from '../common/mapping.types';
import type { Vec2 } from '../geometry/vec2.types';
import { BaseObject } from './base-object';
import { vec2, eq2, clone2 } from '../geometry/vec2';
import { Texture } from './texture-2d';
import { toArgStr } from '../utils/string-formatter';

const WebGL = WebGL2RenderingContext.prototype;

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
    private readonly _framebuffer: WebGLFramebuffer;
    private readonly _texture: Texture;
    private readonly _depthTexture: Texture | null;
    private readonly _renderbuffer: Renderbuffer | null;
    private _size: Vec2 = vec2(0, 0);

    constructor(params: FramebufferParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._logMethod('init', `${params.attachment}, ${params.size.x}x${params.size.y}, ${params.useDepthTexture})`);
        this._runtime = params.runtime;
        this._size = clone2(params.size);
        let info!: ReturnType<typeof setupFramebuffer>;
        try {
            info = setupFramebuffer(
                this._runtime,
                params.attachment,
                this._id,
                this._size,
                !!params.useDepthTexture,
            );
        } catch (err) {
            throw this._logError(err as Error);
        }
        this._framebuffer = info.framebuffer;
        this._texture = info.texture;
        this._depthTexture = info.depthTexture;
        this._renderbuffer = info.renderbuffer;
    }

    dispose(): void {
        this._logMethod('dispose', '');
        this._runtime.gl().deleteFramebuffer(this._framebuffer);
        this._texture.dispose();
        this._depthTexture?.dispose();
        this._renderbuffer?.dispose();
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

    resize(size: Vec2): void {
        if (eq2(this._size, size)) {
            return;
        }
        this._size = clone2(size);
        this._logMethod('resize', toArgStr(size));
        resizeTexture(this._texture, size);
        if (this._depthTexture) {
            resizeTexture(this._depthTexture, size);
        }
        if (this._renderbuffer) {
            resizeRenderbuffer(this._renderbuffer, size);
        }
    }
}

function setupFramebuffer(
    runtime: FramebufferRuntime,
    attachment: FRAMEBUFFER_ATTACHMENT,
    id: string,
    size: Vec2,
    useDepthTexture: boolean,
): AttachmentInfo & { framebuffer: WebGLFramebuffer } {
    const gl = runtime.gl();
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        throw new Error('failed to create framebuffer');
    }
    let info!: AttachmentInfo;
    try {
        runtime.bindFramebufferRaw(framebuffer);
        switch (attachment) {
        case 'color':
            info = setupColorAttachment(runtime, size);
            break;
        case 'color|depth':
            info = setupColorDepthAttachment(runtime, id, size, useDepthTexture);
            break;
        case 'color|depth|stencil':
            info = setupColorDepthStencilAttachment(runtime, id, size, useDepthTexture);
            break;
        default:
            throw new Error(`bad attachment type: ${attachment}`);
        }
        const status = runtime.gl().checkFramebufferStatus(GL_FRAMEBUFFER);
        if (status !== GL_FRAMEBUFFER_COMPLETE) {
            throw new Error(`failed to setup attachment: ${ERRORS_MAP[status]}`);
        }
        return { framebuffer, ...info };
    } catch (err) {
        gl.deleteFramebuffer(framebuffer);
        info?.texture?.dispose();
        info?.depthTexture?.dispose();
        info?.renderbuffer?.dispose();
        throw err;

    } finally {
        runtime.bindFramebufferRaw(null);
    }
}

function setupTexture(
    runtime: FramebufferRuntime,
    size: Vec2,
    format: TEXTURE_FORMAT,
    params: TextureParameters,
    attachment: number,
): Texture {
    const texture = new Texture({ runtime: runtime as unknown as TextureRuntime });
    texture.setFormat(format);
    texture.setParameters(params);
    attachTexture(runtime, attachment, texture);
    resizeTexture(texture, size);
    return texture;
}

function setupRenderbuffer(
    runtime: FramebufferRuntime,
    id: string,
    size: Vec2,
    format: number,
    attachment: number,
): Renderbuffer {
    const renderbuffer = new Renderbuffer(runtime, id, format);
    attachRenderbuffer(runtime, attachment, renderbuffer);
    resizeRenderbuffer(renderbuffer, size);
    return renderbuffer;
}

function setupColorAttachment(runtime: FramebufferRuntime, size: Vec2): AttachmentInfo {
    const texture = setupTexture(runtime, size, 'rgba', COLOR_TEXTURE_PARAMS, GL_COLOR_ATTACHMENT0);
    return {
        texture,
        depthTexture: null,
        renderbuffer: null,
    };
}

function setupColorDepthAttachment(
    runtime: FramebufferRuntime,
    id: string,
    size: Vec2,
    useDepthTexture: boolean,
): AttachmentInfo {
    const info = setupColorAttachment(runtime, size);
    const depthTexture = useDepthTexture
        ? setupTexture(runtime, size, 'depth_component32f', DEPTH_TEXTURE_PARAMS, GL_DEPTH_ATTACHMENT) : null;
    const renderbuffer = useDepthTexture
        ? null : setupRenderbuffer(runtime, id, size, GL_DEPTH_COMPONENT16, GL_DEPTH_ATTACHMENT);
    return {
        ...info,
        depthTexture,
        renderbuffer,
    };
}

function setupColorDepthStencilAttachment(
    runtime: FramebufferRuntime,
    id: string,
    size: Vec2,
    useDepthTexture: boolean,
): AttachmentInfo {
    const info = setupColorAttachment(runtime, size);
    const depthTexture = useDepthTexture
        ? setupTexture(
            runtime,
            size,
            'depth_stencil',
            DEPTH_STENCIL_TEXTURE_PARAMS,
            GL_DEPTH_STENCIL_ATTACHMENT,
        )
        : null;
    const renderbuffer = useDepthTexture
        ? null
        : setupRenderbuffer(
            runtime,
            id,
            size,
            GL_DEPTH_STENCIL,
            GL_DEPTH_STENCIL_ATTACHMENT,
        );
    return {
        ...info,
        depthTexture,
        renderbuffer,
    };
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
