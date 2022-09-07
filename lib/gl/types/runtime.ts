export type BUFFER_MASK = (
    | 'color' | 'depth' | 'stencil'
    | 'color|depth' | 'color|stencil' | 'depth|stencil'
    | 'color|depth|stencil'
);

export type DEPTH_FUNC = (
    'never' | 'less' | 'lequal' | 'greater' | 'gequal' | 'equal' | 'notequal' | 'always'
);

export type CULL_FACE = (
    'back' | 'front' | 'front_and_back'
);

export type EXTENSION = ('element_index_uint' | 'depth_texture');

export interface RuntimeOptions {
    readonly alpha?: boolean;
    readonly antialias?: boolean;
    readonly premultipliedAlpha?: boolean;
    readonly trackWindowResize?: boolean;
    readonly extensions?: ReadonlyArray<EXTENSION>;
}
