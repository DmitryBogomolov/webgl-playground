import {
    TEXTURE_WRAP, TEXTURE_MAG_FILTER, TEXTURE_MIN_FILTER, TEXTURE_FORMAT,
    TextureParameters, TextureData, ImageDataOptions, TextureRuntime,
} from './types/texture';
import { Vec2 } from '../geometry/types/vec2';
import { GLValuesMap } from './types/gl-values-map';
import { GLHandleWrapper } from './types/gl-handle-wrapper';
import { BaseWrapper } from './base-wrapper';
import { vec2, ZERO2 } from '../geometry/vec2';

const WebGL = WebGLRenderingContext.prototype;

const GL_TEXTURE_2D = WebGL.TEXTURE_2D;

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

function isTextureData(source: TextureData | TexImageSource): source is TextureData {
    return 'size' in source && 'data' in source;
}

export class Texture extends BaseWrapper implements GLHandleWrapper<WebGLTexture> {
    private readonly _runtime: TextureRuntime;
    private readonly _texture: WebGLTexture;
    private _size: Vec2 = ZERO2;
    // Original default texture state is slightly different. This one seems to be more common.
    // Initial texture state is updated right after texture object is created.
    private _state: State = {
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
        mag_filter: 'linear',
        min_filter: 'linear',
    };

    constructor(runtime: TextureRuntime, tag?: string) {
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

    private _initTextureState(): void {
        const gl = this._runtime.gl;
        this._runtime.bindTexture(this);
        // Default "wrap_s", "wrap_t" values are "repeat". Default "min_filter" value is "nearest_mipmap_linear".
        // Change them to a more suitable ones.
        gl.texParameteri(GL_TEXTURE_2D, GL_PARAMETER_NAMES['wrap_s'], WRAP_MAP['clamp_to_edge']);
        gl.texParameteri(GL_TEXTURE_2D, GL_PARAMETER_NAMES['wrap_t'], WRAP_MAP['clamp_to_edge']);
        gl.texParameteri(GL_TEXTURE_2D, GL_PARAMETER_NAMES['min_filter'], MIN_FILTER_MAP['linear']);
    }

    setImageData(source: TextureData | TexImageSource, options?: ImageDataOptions): void {
        const gl = this._runtime.gl;
        let unpackFlipY = false;
        let generateMipmap = false;
        let format = DEFAULT_TEXTURE_FORMAT;
        let type = DEFAULT_TEXTURE_TYPE;
        if (options) {
            unpackFlipY = !!options.unpackFlipY;
            generateMipmap = !!options.generateMipmap;
            if (options.format) {
                format = FORMAT_MAP[options.format] || DEFAULT_TEXTURE_FORMAT;
                type = TYPE_MAP[options.format] || DEFAULT_TEXTURE_TYPE;
            }
        }
        this._runtime.pixelStoreUnpackFlipYWebgl(unpackFlipY);
        this._runtime.bindTexture(this);
        if (isTextureData(source)) {
            const { size, data } = source;
            this._logger.log(
                'set_image_data(size: {0}x{1}, data: {2})', size.x, size.y, data ? data.byteLength : 'null',
            );
            gl.texImage2D(GL_TEXTURE_2D, 0, format, size.x, size.y, 0, format, type, data);
            this._size = size;
        } else {
            this._logger.log('set_image_data(source: {0})', source);
            gl.texImage2D(GL_TEXTURE_2D, 0, format, format, type, source);
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
                const value = GL_MAPS[key as keyof State][val as keyof typeof GL_MAPS];
                if (!value) {
                    throw this._logger.error('set_paramater({0} = {1}): bad value', key, val);
                }
                if (this._state[key as keyof State] !== val) {
                    this._logger.log('set_parameter({0} = {1})', key, val);
                    this._runtime.bindTexture(this);
                    gl.texParameteri(GL_TEXTURE_2D, GL_PARAMETER_NAMES[key as keyof State], value);
                    this._state[key as keyof State] = val as never;
                }
            }
        }
    }
}
