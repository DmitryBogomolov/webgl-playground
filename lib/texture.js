import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    TEXTURE_2D, TEXTURE0,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
    UNPACK_FLIP_Y_WEBGL,
    CLAMP_TO_EDGE, NEAREST, LINEAR,
    RGBA, UNSIGNED_BYTE,
} = constants;

const PARAM_NAME_MAP = {
    'wrap-s': TEXTURE_WRAP_S,
    'wrap-t': TEXTURE_WRAP_T,
    'min-filter': TEXTURE_MIN_FILTER,
    'mag-filter': TEXTURE_MAG_FILTER,
};

const PARAM_VALUE_MAP = {
    'clamp-to-edge': CLAMP_TO_EDGE,
    'nearest': NEAREST,
    'linear': LINEAR,
};

export class Texture extends BaseWrapper {
    _init() {
        this._handle = this._context.handle().createTexture();
    }

    _dispose() {
        this._context.handle().deleteTexture(this._handle);
    }
}

/** @typedef {import('./context').Context} Context */

Texture.contextMethods = {
    createTexture(/** @type {Context} */ctx) {
        return new Texture(ctx);
    },

    bindTexture(/** @type {Context} */ctx, /** @type {Texture} */target) {
        ctx.logCall('bind_texture', target ? target.id() : null);
        ctx.handle().bindTexture(TEXTURE_2D, target ? target.handle() : null);
    },

    activeTexture(/** @type {Context} */ctx, /** @type {number} */unit) {
        ctx.logCall('active_texture', unit);
        ctx.handle().activeTexture(TEXTURE0 + unit);
    },

    setTextureParameters(/** @type {Context} */ctx, /** @type {Object} */params) {
        const keys = Object.keys(params);
        ctx.logCall('set_texture_parameters', keys);
        const handle = ctx.handle();
        keys.forEach((name) => {
            const value = params[name];
            handle.texParameteri(TEXTURE_2D, PARAM_NAME_MAP[name], PARAM_VALUE_MAP[value]);
        });
    },

    setTextureImage(
        /** @type {Context} */ctx, /** @type {number} */width, /** @type {number} */height,
        /** @type {ArrayBufferView} */data,
    ) {
        ctx.logCall('set_texture_image', `${width},${height},${data ? data.length : null}`);
        ctx.handle().texImage2D(
            TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, data,
        );
    },

    setUnpackFlipY(/** @type {Context} */ctx, /** @type {number | boolean} */value) {
        ctx.logCall('set_unpack_flip_y', value);
        ctx.handle().pixelStorei(UNPACK_FLIP_Y_WEBGL, value);
    },
};
