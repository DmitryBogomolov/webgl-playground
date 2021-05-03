import { Runtime_ } from './runtime_';
import { contextConstants } from './context-constants';
import { generateId, Logger, raiseError } from './utils';

const {
    TEXTURE_2D, TEXTURE0,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
    UNPACK_FLIP_Y_WEBGL,
    REPEAT, CLAMP_TO_EDGE, NEAREST, LINEAR,
    RGBA, UNSIGNED_BYTE,
} = contextConstants;

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

export class Texture_ {
    private readonly _id = generateId('Texture');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime_;
    private readonly _texture: WebGLTexture;

    constructor(runtime: Runtime_) {
        this._logger.log('init');
        this._runtime = runtime;
        this._texture = this._createTexture();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl.deleteTexture(this._texture);
    }

    private _createTexture(): WebGLTexture {
        const texture = this._runtime.gl.createTexture();
        if (!texture) {
            throw raiseError(this._logger, 'Failed to create texture.');
        }
        return texture;
    }

    setImageData({ data, width, height }: ImageData, unpackFlipY: boolean = false): void {
        this._logger.log('set_image_data', width, height, data.length);
        const gl = this._runtime.gl;
        gl.pixelStorei(UNPACK_FLIP_Y_WEBGL, unpackFlipY);
        gl.bindTexture(TEXTURE_2D, this._texture);
        gl.texImage2D(TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, data);
    }

    setParameters(params: TextureParameters): void {
        this._logger.log('set_parameters', params);
        const gl = this._runtime.gl;
        gl.bindTexture(TEXTURE_2D, this._texture);
        for (const [name, value] of Object.entries(params)) {
            const pname = PARAM_NAME_MAP[name as Names];
            const pvalue = PARAM_VALUE_MAP[value as Values];
            gl.texParameteri(TEXTURE_2D, pname, pvalue);
        }
    }

    setUnit(unit: number): void {
        this._logger.log('set_unit', unit);
        const gl = this._runtime.gl;
        gl.activeTexture(TEXTURE0 + unit);
        gl.bindTexture(TEXTURE_2D, this._texture);
    }
}