import type { Vec2 } from '../geometry/vec2.types';
import type { BaseObjectParams } from './base-object.types';
export type {
    BUFFER_MASK,
    DEPTH_FUNC,
    StencilFuncState, StencilOpState, STENCIL_FUNC, STENCIL_OP,
    CULL_FACE,
    BLEND_FUNC,
    RenderState,
} from './render-state.types';

export type READ_PIXELS_FORMAT = (
    'alpha' | 'rgb' | 'rgba'
);

export type UNPACK_COLORSPACE_CONVERSION = (
    'none' | 'browser_default'
);

export interface ReadPixelsOptions {
    readonly p1?: Vec2;
    readonly p2?: Vec2;
    readonly format?: READ_PIXELS_FORMAT;
}

export interface RuntimeParams extends BaseObjectParams {
    readonly element: HTMLElement;
    readonly trackElementResize?: boolean;
    readonly contextAttributes?: WebGLContextAttributes;
}
