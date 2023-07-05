import type {
    TEXTURE_WRAP, TEXTURE_MAG_FILTER, TEXTURE_MIN_FILTER, TEXTURE_FORMAT,
    TextureRuntimeBase, TextureParameters, TextureImageData, TextureRawImageData, TextureImageDataOptions,
} from './texture-base.types';
import type { Vec2 } from '../geometry/vec2.types';
import type { UNPACK_COLORSPACE_CONVERSION } from './runtime.types';
import type { GLValuesMap } from './gl-values-map.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import { BaseDisposable } from '../common/base-disposable';
import { vec2, isVec2, eq2, clone2, ZERO2 } from '../geometry/vec2';

const WebGL = WebGLRenderingContext.prototype;

const WRAP_MAP: GLValuesMap<TEXTURE_WRAP> = {
    'repeat': WebGL.REPEAT,
    'clamp_to_edge': WebGL.CLAMP_TO_EDGE,
    'mirrored_repeat': WebGL.MIRRORED_REPEAT,
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

export abstract class TextureBase extends BaseDisposable implements GLHandleWrapper<WebGLTexture> {
    protected readonly _runtime: TextureRuntimeBase;
    private readonly _texture: WebGLTexture;
    protected readonly _target!: number;
    protected _size: Vec2 = clone2(ZERO2);
    private _needMipmap: boolean = false;
    // Original default texture state is slightly different. This one seems to be more common.
    // Initial texture state is updated right after texture object is created.
    private readonly _state: State = {
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
        mag_filter: 'linear',
        min_filter: 'linear',
    };

    constructor(runtime: TextureRuntimeBase, tag?: string) {
        super(runtime.logger(), tag);
        this._logger.log('init');
        this._runtime = runtime;
        this._texture = this._createTexture();
        this._initTextureState();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl().deleteTexture(this._texture);
        this._dispose();
    }

    glHandle(): WebGLTexture {
        return this._texture;
    }

    size(): Vec2 {
        return this._size;
    }

    private _createTexture(): WebGLTexture {
        const texture = this._runtime.gl().createTexture();
        if (!texture) {
            throw this._logger.error('failed to create texture');
        }
        return texture;
    }

    protected abstract _bind(): void;

    private _initTextureState(): void {
        const gl = this._runtime.gl();
        this._bind();
        // Default "wrap_s", "wrap_t" values are "repeat". Default "min_filter" value is "nearest_mipmap_linear".
        // Change them to a more suitable ones.
        gl.texParameteri(this._target, GL_PARAMETER_NAMES['wrap_s'], WRAP_MAP['clamp_to_edge']);
        gl.texParameteri(this._target, GL_PARAMETER_NAMES['wrap_t'], WRAP_MAP['clamp_to_edge']);
        gl.texParameteri(this._target, GL_PARAMETER_NAMES['min_filter'], MIN_FILTER_MAP['linear']);
    }

    protected _beginDataUpdate(options: TextureImageDataOptions | undefined): { format: number, type: number } {
        // These defaults are implicitly duplicated. Find a way to solve it.
        let unpackFlipY = false;
        let unpackPremultiplyAlpha = false;
        let unpackColorSpaceConversion: UNPACK_COLORSPACE_CONVERSION = 'browser_default';
        let format = DEFAULT_TEXTURE_FORMAT;
        let type = DEFAULT_TEXTURE_TYPE;
        if (options) {
            unpackFlipY = !!(options.unpackFlipY || unpackFlipY);
            unpackPremultiplyAlpha = !!(options.unpackPremultiplyAlpha || unpackPremultiplyAlpha);
            unpackColorSpaceConversion = options.unpackColorSpaceConversion || unpackColorSpaceConversion;
            if (options.format) {
                format = FORMAT_MAP[options.format] || DEFAULT_TEXTURE_FORMAT;
                type = TYPE_MAP[options.format] || DEFAULT_TEXTURE_TYPE;
            }
        }
        this._runtime.setPixelStoreUnpackFlipYWebgl(unpackFlipY);
        this._runtime.setPixelStoreUnpackPremultiplyAlphaWebgl(unpackPremultiplyAlpha);
        this._runtime.setPixelStoreUnpackColorSpaceConversionWebgl(unpackColorSpaceConversion);
        this._bind();
        return { format, type };
    }

    protected _updateData(imageData: TextureImageData, target: number, format: number, type: number): void {
        if (isTextureRawImageData(imageData)) {
            const { size, data } = imageData;
            this._runtime.gl().texImage2D(target, 0, format, size.x, size.y, 0, format, type, data);
            this._size = clone2(size);
        } else {
            this._runtime.gl().texImage2D(target, 0, format, format, type, imageData);
            // @ts-ignore Properties exist.
            this._size = vec2(imageData.width, imageData.height);
        }
        if (this._needMipmap) {
            this._generateMipmap();
        }
    }

    private _generateMipmap(): void {
        this._logger.log('generate_mipmap');
        this._runtime.gl().generateMipmap(this._target);
    }

    setParameters(params: TextureParameters): void {
        const gl = this._runtime.gl();
        if (!params) {
            throw this._logger.error('set_parameters: not defined');
        }
        for (const entry of Object.entries(params)) {
            const key = entry[0] as keyof State;
            const val = entry[1] as State[keyof State];
            if (val !== undefined) {
                const value = GL_MAPS[key][val];
                if (!value) {
                    throw this._logger.error('set_paramater({0} = {1}): bad value', key, val);
                }
                if (this._state[key] !== val) {
                    this._logger.log('set_parameter({0} = {1})', key, val);
                    this._bind();
                    gl.texParameteri(this._target, GL_PARAMETER_NAMES[key], value);
                    this._state[key] = val as never;
                }
            }
        }
        const needMipmap = isMipmapRequired(this._state.min_filter);
        if (needMipmap && !this._needMipmap) {
            this._needMipmap = true;
            if (!eq2(this._size, ZERO2)) {
                this._generateMipmap();
            }
        }
    }
}

function isMipmapRequired(minFilter: TEXTURE_MIN_FILTER): boolean {
    return minFilter !== 'nearest' && minFilter !== 'linear';
}

function isTextureRawImageData(imageData: TextureImageData): imageData is TextureRawImageData {
    return imageData
        && isVec2((imageData as TextureRawImageData).size)
        && ('data' in imageData);
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
