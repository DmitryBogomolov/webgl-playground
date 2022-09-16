import { ImageRendererImageData } from './types/image-renderer';
import { Runtime } from '../gl/runtime';
import { Primitive } from '../gl/primitive';
import { Program } from '../gl/program';
import { Texture } from '../gl/texture';

export class ImageRenderer {
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _texture: Texture;

    constructor(runtime: Runtime) {
        this._runtime = runtime;
        this._primitive = new Primitive(runtime);
        this._texture = new Texture(runtime);
        this._setupPrimitive();
    }

    dispose(): void {
        this._texture.dispose();
        this._primitive.dispose();
        this._primitive.program().dispose();
    }

    private _setupPrimitive(): void {

    }

    setImageData(data: ImageRendererImageData): void {

    }

    render(): void {

    }
}
