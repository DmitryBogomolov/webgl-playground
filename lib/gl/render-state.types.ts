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

export interface RenderState {
    readonly depthTest: boolean;
    readonly depthMask: boolean;
    readonly depthFunc: DEPTH_FUNC;
    readonly stencilTest: boolean;
    readonly stencilMask: number;
    readonly stencilFunc: StencilFuncState;
    readonly stencilOp: StencilOpState;
    readonly culling: boolean;
    readonly cullFace: CULL_FACE;
    readonly blending: boolean;
    readonly blendFunc: BLEND_FUNC;
}
