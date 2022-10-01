import {
    TEXTURE_WRAP, TEXTURE_MAG_FILTER, TEXTURE_MIN_FILTER, TEXTURE_FORMAT,
    TextureRuntimeBase, TextureParameters, TextureImageData, TextureRawImageData, TextureImageDataOptions,
} from './types/texture-base';
import { Vec2 } from '../geometry/types/vec2';
import { GLValuesMap } from './types/gl-values-map';
import { GLHandleWrapper } from './types/gl-handle-wrapper';
import { BaseWrapper } from './base-wrapper';
import { vec2, ZERO2 } from '../geometry/vec2';

const WebGL = WebGLRenderingContext.prototype;

const WRAP_MAP: GLValuesMap<TEXTURE_WRAP> = {
    'repeat': WebGL.REPEAT,
    'clamp_to_edge': WebGL.CLAMP_TO_EDGE,
};

const MAG_FILTER_MAP: GLValuesMap<TEXTURE_MAG_FILTER> = {
    'nearest': WebGL.NEAREST,
    'linear': WebGL.LINEAR,
};

const MIN_FILTER_MAP: GLValuesMap<TEXTURE_MIN_FILTER> = {
    'nearest': WebGL.NEAREST,
    'linear': WebGL.LINEAR,
    'nearest_mipmap_nearest': WebGL.NEAREST_MIPMAP_NEAREST,
    'linear_mipmap_nearest': WebGL.LINEAR_MIPMAP_NEAREST,
    'nearest_mipmap_linear': WebGL.NEAREST_MIPMAP_LINEAR,
    'linear_mipmap_linear': WebGL.LINEAR_MIPMAP_LINEAR,
};

const FORMAT_MAP: GLValuesMap<TEXTURE_FORMAT> = {
    'rgba': WebGL.RGBA,
    'rgb': WebGL.RGB,
    'luminance': WebGL.LUMINANCE,
    'alpha': WebGL.ALPHA,
    'luminance_alpha': WebGL.LUMINANCE_ALPHA,
    'depth_component16': WebGL.DEPTH_COMPONENT,
    'depth_component32': WebGL.DEPTH_COMPONENT,
    'depth_stencil': WebGL.DEPTH_STENCIL,
};
const DEFAULT_TEXTURE_FORMAT = FORMAT_MAP['rgba'];

const TYPE_MAP: GLValuesMap<TEXTURE_FORMAT> = {
    'rgba': WebGL.UNSIGNED_BYTE,
    'rgb': WebGL.UNSIGNED_BYTE,
    'luminance': WebGL.UNSIGNED_BYTE,
    'alpha': WebGL.UNSIGNED_BYTE,
    'luminance_alpha': WebGL.UNSIGNED_BYTE,
    'depth_component16': WebGL.UNSIGNED_SHORT,
    'depth_component32': WebGL.UNSIGNED_INT,
    'depth_stencil': WebGL.UNSIGNED_INT,
};
const DEFAULT_TEXTURE_TYPE = TYPE_MAP['rgba'];

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
type State = Required<Writeable<TextureParameters>>;

const GL_PARAMETER_NAMES: GLValuesMap<keyof State> = {
    'wrap_s': WebGL.TEXTURE_WRAP_S,
    'wrap_t': WebGL.TEXTURE_WRAP_T,
    'mag_filter': WebGL.TEXTURE_MAG_FILTER,
    'min_filter': WebGL.TEXTURE_MIN_FILTER,
};

const GL_MAPS: Readonly<Record<keyof State, GLValuesMap<string>>> = {
    'wrap_s': WRAP_MAP,
    'wrap_t': WRAP_MAP,
    'mag_filter': MAG_FILTER_MAP,
    'min_filter': MIN_FILTER_MAP,
};

export abstract class TextureBase extends BaseWrapper implements GLHandleWrapper<WebGLTexture> {
    protected readonly _runtime: TextureRuntimeBase;
    private readonly _texture: WebGLTexture;
    protected readonly _target!: number;
    protected _size: Vec2 = ZERO2;
    // Original default texture state is slightly different. This one seems to be more common.
    // Initial texture state is updated right after texture object is created.
    private _state: State = {
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
        mag_filter: 'linear',
        min_filter: 'linear',
    };

    constructor(runtime: TextureRuntimeBase, tag?: string) {
        super(tag);
        this._logger.log('init');
        this._runtime = runtime;
        this._texture = this._createTexture();
        this._initTextureState();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl.deleteTexture(this._texture);
    }

    glHandle(): WebGLTexture {
        return this._texture;
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

    protected abstract _bind(): void;

    private _initTextureState(): void {
        const gl = this._runtime.gl;
        this._bind();
        // Default "wrap_s", "wrap_t" values are "repeat". Default "min_filter" value is "nearest_mipmap_linear".
        // Change them to a more suitable ones.
        gl.texParameteri(this._target, GL_PARAMETER_NAMES['wrap_s'], WRAP_MAP['clamp_to_edge']);
        gl.texParameteri(this._target, GL_PARAMETER_NAMES['wrap_t'], WRAP_MAP['clamp_to_edge']);
        gl.texParameteri(this._target, GL_PARAMETER_NAMES['min_filter'], MIN_FILTER_MAP['linear']);
    }

    protected _beginDataUpdate(options?: TextureImageDataOptions): { format: number, type: number } {
        let unpackFlipY = false;
        let format = DEFAULT_TEXTURE_FORMAT;
        let type = DEFAULT_TEXTURE_TYPE;
        if (options) {
            unpackFlipY = !!options.unpackFlipY;
            if (options.format) {
                format = FORMAT_MAP[options.format] || DEFAULT_TEXTURE_FORMAT;
                type = TYPE_MAP[options.format] || DEFAULT_TEXTURE_TYPE;
            }
        }
        this._runtime.pixelStoreUnpackFlipYWebgl(unpackFlipY);
        this._bind();
        return { format, type };
    }

    protected _updateData(imageData: TextureImageData, target: number, format: number, type: number): void {
        if (isTextureRawImageData(imageData)) {
            const { size, data } = imageData;
            this._runtime.gl.texImage2D(target, 0, format, size.x, size.y, 0, format, type, data);
            this._size = size;
        } else {
            this._runtime.gl.texImage2D(target, 0, format, format, type, imageData);
            this._size = vec2(imageData.width, imageData.height);
        }
    }

    protected _endDataUpdate(options?: TextureImageDataOptions): void {
        if (options && options.generateMipmap) {
            this._runtime.gl.generateMipmap(this._target);
        }
    }

    setParameters(params: TextureParameters): void {
        const gl = this._runtime.gl;
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined) {
                const value = GL_MAPS[key as keyof State][val as keyof typeof GL_MAPS];
                if (!value) {
                    throw this._logger.error('set_paramater({0} = {1}): bad value', key, val);
                }
                if (this._state[key as keyof State] !== val) {
                    this._logger.log('set_parameter({0} = {1})', key, val);
                    this._bind();
                    gl.texParameteri(this._target, GL_PARAMETER_NAMES[key as keyof State], value);
                    this._state[key as keyof State] = val as never;
                }
            }
        }
    }
}

function isTextureRawImageData(imageData: TextureImageData): imageData is TextureRawImageData {
    return 'size' in imageData && 'data' in imageData;
}

export function textureImageDataToStr(imageData: TextureImageData): string {
    if (isTextureRawImageData(imageData)) {
        const { size, data } = imageData;
        return `image_data[size: ${size.x}x${size.y}, data: ${data ? data.byteLength : null}]`;
    } else {
        const str = imageData.toString();
        const ret = /\[object (\w+)\]/.exec(str);
        return `image_data[${ret ? ret[1] : '?'}]`;
    }
}
