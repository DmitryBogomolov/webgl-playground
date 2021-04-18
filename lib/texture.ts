import { BaseWrapper } from './base-wrapper';
import { contextConstants } from './context-constants';
import { ContextView } from './context-view';

const {
    TEXTURE_2D, TEXTURE0,
    TEXTURE_WRAP_S, TEXTURE_WRAP_T,
    TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER,
    UNPACK_FLIP_Y_WEBGL,
    CLAMP_TO_EDGE, NEAREST, LINEAR,
    RGBA, UNSIGNED_BYTE,
} = contextConstants;

const PARAM_NAME_MAP: Record<string, number> = {
    'wrap-s': TEXTURE_WRAP_S,
    'wrap-t': TEXTURE_WRAP_T,
    'min-filter': TEXTURE_MIN_FILTER,
    'mag-filter': TEXTURE_MAG_FILTER,
};

const PARAM_VALUE_MAP: Record<string, number> = {
    'clamp-to-edge': CLAMP_TO_EDGE,
    'nearest': NEAREST,
    'linear': LINEAR,
};

export class Texture extends BaseWrapper<WebGLTexture> {
    protected _createHandle(): WebGLTexture {
        return this._context.handle().createTexture()!;
    }

    protected _destroyHandle() {
        this._context.handle().deleteTexture(this._handle);
    }

    static contextMethods = {
        createTexture(ctx: ContextView) {
            return new Texture(ctx);
        },
    
        bindTexture(ctx: ContextView, target: Texture | null) {
            ctx.logCall('bind_texture', target ? target.id() : null);
            ctx.handle().bindTexture(TEXTURE_2D, target ? target.handle() : null);
        },
    
        activeTexture(ctx: ContextView, unit: number) {
            ctx.logCall('active_texture', unit);
            ctx.handle().activeTexture(TEXTURE0 + unit);
        },
    
        setTextureParameters(ctx: ContextView, params: Record<string, string>) {
            const keys = Object.keys(params);
            ctx.logCall('set_texture_parameters', keys);
            const handle = ctx.handle();
            keys.forEach((name) => {
                const value = params[name];
                handle.texParameteri(TEXTURE_2D, PARAM_NAME_MAP[name], PARAM_VALUE_MAP[value]);
            });
        },
    
        setTextureImage(ctx: ContextView, width: number, height: number, data: ArrayBufferView): void {
            ctx.logCall('set_texture_image', `${width},${height},${data ? data.byteLength : null}`);
            ctx.handle().texImage2D(TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, data);
        },
    
        setUnpackFlipY(ctx: ContextView, value: number | boolean) {
            ctx.logCall('set_unpack_flip_y', value);
            ctx.handle().pixelStorei(UNPACK_FLIP_Y_WEBGL, value);
        },
    };

}

/** @typedef {import('./context').Context} Context */

