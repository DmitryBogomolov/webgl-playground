import { logCall, unwrapHandle } from './utils';
import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    TEXTURE_2D, TEXTURE0,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
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

Texture.prototype._idPrefix = 'Texture';

Texture.contextMethods = {
    bindTexture(context, target) {
        logCall(context, 'bind_texture', target);
        context.handle().bindTexture(TEXTURE_2D, unwrapHandle(target));
    },

    activeTexture(context, unit) {
        context._log(`active_texture(${unit})`);
        context.handle().activeTexture(TEXTURE0 + unit);
    },

    setTextureParameters(context, params) {
        const keys = Object.keys(params);
        context._log(`set_texture_parameters(${params})`);
        const ctx = context.handle();
        keys.forEach((name) => {
            const value = params[name];
            ctx.texParameteri(TEXTURE_2D, PARAM_NAME_MAP[name], PARAM_VALUE_MAP[value]);
        });
    },

    setTextureImage(context, width, height, data) {
        context._log(`set_texture_image(${width},${height},${data ? data.length : null})`);
        context.handle().texImage2D(
            TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, data
        );
    },
};
