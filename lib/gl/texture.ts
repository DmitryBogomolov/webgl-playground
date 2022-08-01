import { Runtime } from './runtime';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { Vec2, vec2, ZERO2 } from '../geometry/vec2';

const {
    TEXTURE_2D,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
    RGBA, UNSIGNED_BYTE,
} = WebGLRenderingContext.prototype;

export type TextureWrapValues = 'repeat' | 'clamp_to_edge';
export type TextureMagFilterValues = 'nearest' | 'linear';
export type TextureMinFilterValues = (
    | 'nearest' | 'linear'
    | 'nearest_mipmap_nearest' | 'linear_mipmap_nearest' | 'nearest_mipmap_linear' | 'linear_mipmap_linear'
);

const WRAP_MAP: Readonly<Record<TextureWrapValues, number>> = {
    'repeat': WebGLRenderingContext.prototype.REPEAT,
    'clamp_to_edge': WebGLRenderingContext.prototype.CLAMP_TO_EDGE,
};

const MAG_FILTER_MAP: Readonly<Record<TextureMagFilterValues, number>> = {
    'nearest': WebGLRenderingContext.prototype.NEAREST,
    'linear': WebGLRenderingContext.prototype.LINEAR,
};

const MIN_FILTER_MAP: Readonly<Record<TextureMinFilterValues, number>> = {
    'nearest': WebGLRenderingContext.prototype.NEAREST,
    'linear': WebGLRenderingContext.prototype.LINEAR,
    'nearest_mipmap_nearest': WebGLRenderingContext.prototype.NEAREST_MIPMAP_NEAREST,
    'linear_mipmap_nearest': WebGLRenderingContext.prototype.LINEAR_MIPMAP_NEAREST,
    'nearest_mipmap_linear': WebGLRenderingContext.prototype.NEAREST_MIPMAP_LINEAR,
    'linear_mipmap_linear': WebGLRenderingContext.prototype.LINEAR_MIPMAP_LINEAR,
};

export interface TextureParameters {
    readonly wrap_s?: TextureWrapValues;
    readonly wrap_t?: TextureWrapValues;
    readonly mag_filter?: TextureMagFilterValues;
    readonly min_filter?: TextureMinFilterValues;
}

export interface ImageDataOptions {
    readonly unpackFlipY?: boolean;
    readonly generateMipmap?: boolean;
}

export interface TextureData {
    readonly size: readonly [number, number];
    readonly data: Uint8ClampedArray;
}

function isTextureData(source: TextureData | TexImageSource): source is TextureData {
    return 'size' in source && 'data' in source;
}

export class Texture {
    private readonly _id = generateId('Texture');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime;
    private readonly _texture: WebGLTexture;
    private _size: Vec2 = ZERO2;
    private _wrapS: TextureWrapValues = 'repeat';
    private _wrapT: TextureWrapValues = 'repeat';
    private _magFilter: TextureMagFilterValues = 'linear';
    private _minFilter: TextureMinFilterValues = 'nearest_mipmap_linear';

    constructor(runtime: Runtime) {
        this._logger.log('init');
        this._runtime = runtime;
        this._texture = this._createTexture();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl.deleteTexture(this._texture);
    }

    size(): Vec2 {
        return this._size;
    }

    private _createTexture(): WebGLTexture {
        const texture = this._runtime.gl.createTexture();
        if (!texture) {
            throw this._logger.error('failed to create texture');
        }
        return texture;
    }

    setImageData(source: TextureData | TexImageSource, options?: ImageDataOptions): void {
        const gl = this._runtime.gl;
        let unpackFlipY = false;
        let generateMipmap = false;
        if (options) {
            unpackFlipY = !!options.unpackFlipY;
            generateMipmap = !!options.generateMipmap;
        }
        this._runtime.pixelStoreUnpackFlipYWebgl(unpackFlipY);
        this._runtime.bindTexture(this._texture, this._id);
        if (isTextureData(source)) {
            const { size, data } = source;
            this._logger.log('set_image_data(size: {0}x{1}, data: {2})', size[0], size[1], data.length);
            gl.texImage2D(TEXTURE_2D, 0, RGBA, size[0], size[1], 0, RGBA, UNSIGNED_BYTE, data);
            this._size = vec2(size[0], size[1]);
        } else {
            this._logger.log('set_image_data(source: {0})', source);
            gl.texImage2D(TEXTURE_2D, 0, RGBA, RGBA, UNSIGNED_BYTE, source);
            this._size = vec2(source.width, source.height);
        }
        if (generateMipmap) {
            gl.generateMipmap(TEXTURE_2D);
        }
    }

    setParameters(params: TextureParameters): void {
        this._logger.log('set_parameters({0})', params);
        const gl = this._runtime.gl;
        if (params.wrap_s !== undefined) {
            const value = WRAP_MAP[params.wrap_s];
            if (!value) {
                throw this._logger.error('bad wrap_s value: {0}', params.wrap_s);
            }
            if (this._wrapS !== params.wrap_s) {
                this._runtime.bindTexture(this._texture, this._id);
                gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, value);
                this._wrapS = params.wrap_s;
            }
        }
        if (params.wrap_t !== undefined) {
            const value = WRAP_MAP[params.wrap_t];
            if (!value) {
                throw this._logger.error('bad wrap_t value: {0}', params.wrap_t);
            }
            if (this._wrapT !== params.wrap_t) {
                this._runtime.bindTexture(this._texture, this._id);
                gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, value);
                this._wrapT = params.wrap_t;
            }
        }
        if (params.mag_filter !== undefined) {
            const value = MAG_FILTER_MAP[params.mag_filter];
            if (!value) {
                throw this._logger.error('bad mag_filter value: {0}', params.mag_filter);
            }
            if (this._magFilter !== params.mag_filter) {
                this._runtime.bindTexture(this._texture, this._id);
                gl.texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, value);
                this._magFilter = params.mag_filter;
            }
        }
        if (params.min_filter !== undefined) {
            const value = MIN_FILTER_MAP[params.min_filter];
            if (!value) {
                throw this._logger.error('bad min_filter value: {0}', params.min_filter);
            }
            if (this._minFilter !== params.min_filter) {
                this._runtime.bindTexture(this._texture, this._id);
                gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, value);
                this._minFilter = params.min_filter;
            }
        }
    }

    setUnit(unit: number): void {
        this._logger.log('set_unit({0})', unit);
        this._runtime.activeTexture(unit);
        this._runtime.bindTexture(this._texture, this._id);
    }
}
