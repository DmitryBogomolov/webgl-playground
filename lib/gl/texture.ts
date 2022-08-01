import { Runtime } from './runtime';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { Vec2, vec2, ZERO2 } from '../geometry/vec2';

const {
    TEXTURE_2D,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
    REPEAT, CLAMP_TO_EDGE, NEAREST, LINEAR,
    RGBA, UNSIGNED_BYTE,
} = WebGLRenderingContext.prototype;

export type TextureWrapValues = 'repeat' | 'clamp_to_edge';
export type TextureFilterValues = 'nearest' | 'linear';

export interface TextureParameters {
    readonly wrap_s?: TextureWrapValues;
    readonly wrap_t?: TextureWrapValues;
    readonly min_filter?: TextureFilterValues;
    readonly mag_filter?: TextureFilterValues;
}

type Names = keyof TextureParameters;
type ParamNameMap = {
    readonly [key in Names]: number;
};
type Values = TextureWrapValues | TextureFilterValues;
type ParamValueMap = {
    readonly [key in Values]: number;
};

const PARAM_NAME_MAP: ParamNameMap = {
    wrap_s: TEXTURE_WRAP_S,
    wrap_t: TEXTURE_WRAP_T,
    min_filter: TEXTURE_MIN_FILTER,
    mag_filter: TEXTURE_MAG_FILTER,
};

const PARAM_VALUE_MAP: ParamValueMap = {
    nearest: NEAREST,
    linear: LINEAR,
    repeat: REPEAT,
    clamp_to_edge: CLAMP_TO_EDGE,
};

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
        this._runtime.bindTexture(this._texture, this._id);
        for (const [name, value] of Object.entries(params)) {
            const paramName = PARAM_NAME_MAP[name as Names];
            const paramValue = PARAM_VALUE_MAP[value as Values];
            gl.texParameteri(TEXTURE_2D, paramName, paramValue);
        }
    }

    setUnit(unit: number): void {
        this._logger.log('set_unit({0})', unit);
        this._runtime.activeTexture(unit);
        this._runtime.bindTexture(this._texture, this._id);
    }
}
