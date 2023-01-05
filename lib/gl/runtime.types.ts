import type { Vec2 } from '../geometry/vec2.types';

export type BUFFER_MASK = (
    | 'color' | 'depth' | 'stencil'
    | 'color|depth' | 'color|stencil' | 'depth|stencil'
    | 'color|depth|stencil'
);

export type DEPTH_FUNC = (
    'never' | 'less' | 'lequal' | 'greater' | 'gequal' | 'equal' | 'notequal' | 'always'
);

export type STENCIL_OP = (
    'keep' | 'zero' | 'replace' | 'incr' | 'incr_wrap' | 'decr' | 'decr_wrap' | 'invert'
);

export type STENCIL_FUNC = (
    'never' | 'less' | 'lequal' | 'greater' | 'gequal' | 'equal' | 'notequal' | 'always'
);

export interface StencilOpState {
    readonly fail: STENCIL_OP;
    readonly zfail: STENCIL_OP;
    readonly zpass: STENCIL_OP;
}

export interface StencilFuncState {
    readonly func: STENCIL_FUNC;
    readonly ref: number;
    readonly mask: number;
}

export type CULL_FACE = (
    'back' | 'front' | 'front_and_back'
);

export type BLEND_FUNC = (
    'one|zero' | 'src_alpha|one_minus_src_alpha' | 'one|one_minus_src_alpha'
);

export type EXTENSION = (
    'element_index_uint' | 'depth_texture'
);

export type READ_PIXELS_FORMAT = (
    'alpha' | 'rgb' | 'rgba'
);

export interface ReadPixelsOptions {
    readonly p1?: Vec2;
    readonly p2?: Vec2;
    readonly format?: READ_PIXELS_FORMAT;
}

export interface RuntimeOptions {
    readonly trackWindowResize?: boolean;
    readonly extensions?: ReadonlyArray<EXTENSION>;
    readonly contextAttributes?: WebGLContextAttributes;
}
