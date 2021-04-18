export interface ContextView {
    handle(): WebGLRenderingContext;
    vaoExt(): OES_vertex_array_object;
    logCall(funcName: string, param: unknown): void;
}
