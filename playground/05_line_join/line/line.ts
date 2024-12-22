import type { Runtime, VertexSchemaInfo, Vec2 } from 'lib';
import { Primitive, Program } from 'lib';

export interface LineParams {
    readonly vertexSchema: VertexSchemaInfo;
    readonly vertShader: string;
    readonly fragShader: string;
}

export abstract class LineBase {
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private _thickness = 1;

    constructor(runtime: Runtime, params: LineParams) {
        this._runtime = runtime;
        this._primitive = new Primitive({ runtime });
        const program = new Program({
            runtime,
            vertShader: params.vertShader,
            fragShader: params.fragShader,
        });
        this._primitive.setup({
            vertexData: 0,
            indexData: 0,
            vertexSchema: params.vertexSchema,
        });
        this._primitive.setProgram(program);
    }

    dispose(): void {
        this._primitive.program().dispose();
        this._primitive.dispose();
    }

    protected abstract _writeVertices(vertices: ReadonlyArray<Vec2>): ArrayBuffer;

    protected abstract _writeIndexes(vertexCount: number): ArrayBuffer;

    protected abstract _updateVertex(vertices: ReadonlyArray<Vec2>, idx: number): [ArrayBuffer, number];

    setVertices(vertices: ReadonlyArray<Vec2>): void {
        const vertexCount = vertices.length;
        const vertexData = this._writeVertices(vertices);
        const indexData = this._writeIndexes(vertexCount);
        this._primitive.setVertexData(vertexData);
        this._primitive.setIndexData(indexData);
    }

    updateVertex(vertices: ReadonlyArray<Vec2>, vertexIdx: number): void {
        const [vertexData, offset] = this._updateVertex(vertices, vertexIdx);
        this._primitive.updateVertexData(vertexData, offset);
    }

    setThickness(thickness: number): void {
        this._thickness = thickness;
    }

    render(): void {
        this._primitive.program().setUniform('u_canvas_size', this._runtime.canvasSize());
        this._primitive.program().setUniform('u_thickness', this._thickness * devicePixelRatio);
        this._primitive.render();
    }
}
