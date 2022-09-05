export interface GLWrapper {
    readonly gl: WebGLRenderingContext;
    readonly vaoExt: OES_vertex_array_object;
    canvas(): HTMLCanvasElement;
}
