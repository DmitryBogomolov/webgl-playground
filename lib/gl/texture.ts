import { Runtime } from './runtime';
import { GLValuesMap } from './gl-values-map';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { Vec2, vec2, ZERO2 } from '../geometry/vec2';

const GL_TEXTURE_2D = WebGLRenderingContext.prototype.TEXTURE_2D;
const GL_UNSIGNED_BYTE = WebGLRenderingContext.prototype.UNSIGNED_BYTE;

export type TEXTURE_WRAP = ('repeat' | 'clamp_to_edge');
export type TEXTURE_MAG_FILTER = ('nearest' | 'linear');
export type TEXTURE_MIN_FILTER = (
    | 'nearest' | 'linear'
    | 'nearest_mipmap_nearest' | 'linear_mipmap_nearest' | 'nearest_mipmap_linear' | 'linear_mipmap_linear'
);

export type TEXTURE_FORMAT = ('rgba' | 'rgb' | 'luminance' | 'alpha' | 'luminance_alpha');

const WRAP_MAP: GLValuesMap<TEXTURE_WRAP> = {
    'repeat': WebGLRenderingContext.prototype.REPEAT,
    'clamp_to_edge': WebGLRenderingContext.prototype.CLAMP_TO_EDGE,
};

const MAG_FILTER_MAP: GLValuesMap<TEXTURE_MAG_FILTER> = {
    'nearest': WebGLRenderingContext.prototype.NEAREST,
    'linear': WebGLRenderingContext.prototype.LINEAR,
};

const MIN_FILTER_MAP: GLValuesMap<TEXTURE_MIN_FILTER> = {
    'nearest': WebGLRenderingContext.prototype.NEAREST,
    'linear': WebGLRenderingContext.prototype.LINEAR,
    'nearest_mipmap_nearest': WebGLRenderingContext.prototype.NEAREST_MIPMAP_NEAREST,
    'linear_mipmap_nearest': WebGLRenderingContext.prototype.LINEAR_MIPMAP_NEAREST,
    'nearest_mipmap_linear': WebGLRenderingContext.prototype.NEAREST_MIPMAP_LINEAR,
    'linear_mipmap_linear': WebGLRenderingContext.prototype.LINEAR_MIPMAP_LINEAR,
};

const FORMAT_MAP: GLValuesMap<TEXTURE_FORMAT> = {
    'rgba': WebGLRenderingContext.prototype.RGBA,
    'rgb': WebGLRenderingContext.prototype.RGB,
    'luminance': WebGLRenderingContext.prototype.LUMINANCE,
    'alpha': WebGLRenderingContext.prototype.ALPHA,
    'luminance_alpha': WebGLRenderingContext.prototype.LUMINANCE_ALPHA,
};
const DEFAULT_TEXTURE_FORMAT = FORMAT_MAP['rgba'];

const GL_PARAMETER_NAMES: GLValuesMap<keyof RawState> = {
    'wrap_s': WebGLRenderingContext.prototype.TEXTURE_WRAP_S,
    'wrap_t': WebGLRenderingContext.prototype.TEXTURE_WRAP_T,
    'mag_filter': WebGLRenderingContext.prototype.TEXTURE_MAG_FILTER,
    'min_filter': WebGLRenderingContext.prototype.TEXTURE_MIN_FILTER,
};

const GL_MAPS: Readonly<Record<keyof RawState, GLValuesMap<string>>> = {
    'wrap_s': WRAP_MAP,
    'wrap_t': WRAP_MAP,
    'mag_filter': MAG_FILTER_MAP,
    'min_filter': MIN_FILTER_MAP,
};

interface RawState {
    wrap_s?: TEXTURE_WRAP;
    wrap_t?: TEXTURE_WRAP;
    mag_filter?: TEXTURE_MAG_FILTER;
    min_filter?: TEXTURE_MIN_FILTER;
}
type State = Required<RawState>;
export type TextureParameters = Readonly<RawState>;

export interface ImageDataOptions {
    readonly unpackFlipY?: boolean;
    readonly generateMipmap?: boolean;
    readonly format?: TEXTURE_FORMAT;
}

export interface TextureData {
    readonly size: readonly [number, number];
    readonly data: ArrayBufferView;
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
    private _state: State = {
        wrap_s: 'repeat',
        wrap_t: 'repeat',
        mag_filter: 'linear',
        min_filter: 'nearest_mipmap_linear',
    };

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

    texture(): WebGLTexture {
        return this._texture;
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
        let format = DEFAULT_TEXTURE_FORMAT;
        if (options) {
            unpackFlipY = !!options.unpackFlipY;
            generateMipmap = !!options.generateMipmap;
            if (options.format) {
                format = FORMAT_MAP[options.format] || DEFAULT_TEXTURE_FORMAT;
            }
        }
        this._runtime.pixelStoreUnpackFlipYWebgl(unpackFlipY);
        this._runtime.bindTexture(this._texture, this._id);
        if (isTextureData(source)) {
            const { size, data } = source;
            const [width, height] = size;
            this._logger.log('set_image_data(size: {0}x{1}, data: {2})', size[0], size[1], data.byteLength);
            gl.texImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
            this._size = vec2(width, height);
        } else {
            this._logger.log('set_image_data(source: {0})', source);
            gl.texImage2D(GL_TEXTURE_2D, 0, format, format, GL_UNSIGNED_BYTE, source);
            this._size = vec2(source.width, source.height);
        }
        if (generateMipmap) {
            gl.generateMipmap(GL_TEXTURE_2D);
        }
    }

    setParameters(params: TextureParameters): void {
        const gl = this._runtime.gl;
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined) {
                const value = GL_MAPS[key as keyof State][val];
                if (!value) {
                    throw this._logger.error('set_paramater({0} = {1}): bad value', key, val);
                }
                if (this._state[key as keyof State] !== val) {
                    this._logger.log('set_parameter({0} = {1})', key, val);
                    this._runtime.bindTexture(this._texture, this._id);
                    gl.texParameteri(GL_TEXTURE_2D, GL_PARAMETER_NAMES[key as keyof State], value);
                    this._state[key as keyof State] = val as never;
                }
            }
        }
    }

    setUnit(unit: number): void {
        this._logger.log('set_unit({0})', unit);
        this._runtime.activeTexture(unit, this._texture, this._id);
    }
}
