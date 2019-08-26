import { logCall, unwrapHandle } from './utils';
import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    TEXTURE_2D, TEXTURE0,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
    CLAMP_TO_EDGE, NEAREST,
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
};

export class Texture extends  BaseWrapper {
    _init() {
        this._handle = this._context.handle().createTexture();
    }

    _dispose() {
        this._context.handle().deleteTexture(this._handle);
    }

    bind() {
        bindTexture(this._context, this);
    }

    setParameters(params) {
        const keys = Object.keys(params);
        this._log(`set_parameters(${params})`);
        const ctx = this._context.handle();
        keys.forEach((name) => {
            const value = params[name];
            ctx.texParameteri(TEXTURE_2D, PARAM_NAME_MAP[name], PARAM_VALUE_MAP[value]);
        });
    }

    setImage(width, height, data) {
        this._log(`set_image(${width},${height},${data ? data.length : null})`);
        this._context.handle().texImage2D(
            TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, data
        );
    }
}

Texture.prototype._idPrefix = 'Texture';

export function bindTexture(context, target) {
    logCall(context, 'bind_texture', target);
    context.handle().bindTexture(TEXTURE_2D, unwrapHandle(target));
}

export function activeTexture(context, unit) {
    context._log(`active_texture(${unit})`);
    context.handle().activeTexture(TEXTURE0 + unit);
}
