import type { Runtime, VertexSchemaInfo, Vec2 } from 'lib';
import { Primitive, Program } from 'lib';

export interface LineParams {
    readonly vertexSchema: VertexSchemaInfo;
    readonly vertShader: string;
    readonly fragShader: string;
}

export interface SetPointsResult {
    readonly vertexData: ArrayBufferView<ArrayBuffer>;
    readonly indexData: ArrayBufferView<ArrayBuffer>;
}

export interface UpdatePointResult {
    readonly vertexData: ArrayBufferView<ArrayBuffer>;
    readonly offset: number;
}

export abstract class LineBase {
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private _thickness: number = 1;

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

    protected abstract _setPoints(points: ArrayLike<Vec2>): SetPointsResult;

    protected abstract _updatePoint(points: ArrayLike<Vec2>, idx: number): UpdatePointResult;

    setPoints(points: ArrayLike<Vec2>): void {
        const { vertexData, indexData } = this._setPoints(points);
        this._primitive.setVertexData(vertexData);
        this._primitive.setIndexData(indexData);
    }

    updatePoint(points: ArrayLike<Vec2>, pointIdx: number): void {
        const { vertexData, offset } = this._updatePoint(points, pointIdx);
        this._primitive.updateVertexData(vertexData, offset);
    }

    setThickness(thickness: number): void {
        this._thickness = thickness;
    }

    render(): void {
        this._primitive.program().setUniform('u_canvas_size', this._runtime.renderSize);
        this._primitive.program().setUniform('u_thickness', this._thickness * devicePixelRatio);
        this._primitive.render();
    }
}
