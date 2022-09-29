import type {
    TextureCubeRuntime, TextureCubeImageData, TextureImageDataOptions,
} from './types/texture-cube';
import { Texture } from './texture';
import { updateTexImage } from './texture-helper';

const WebGL = WebGLRenderingContext.prototype;

const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_X;
const GL_TEXTURE_CUBE_MAP_POSITIVE_X = WebGL.TEXTURE_CUBE_MAP_POSITIVE_X;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Y;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = WebGL.TEXTURE_CUBE_MAP_POSITIVE_Y;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Z;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = WebGL.TEXTURE_CUBE_MAP_POSITIVE_Z;

export class TextureCube extends Texture {
    constructor(runtime: TextureCubeRuntime, tag?: string) {
        super(runtime, tag);
    }

    protected _bind(): void {
        (this._runtime as TextureCubeRuntime).bindCubeTexture(this);
    }

    // @ts-ignore Override.
    setImageData(source: TextureCubeImageData, options?: TextureImageDataOptions): void {
        const gl = this._runtime.gl;
        const { format, type } = this._beginDataUpdate(options);
        this._size = updateTexImage(source.xNeg, this._logger, gl, GL_TEXTURE_CUBE_MAP_NEGATIVE_X, format, type);
        this._size = updateTexImage(source.xPos, this._logger, gl, GL_TEXTURE_CUBE_MAP_POSITIVE_X, format, type);
        this._size = updateTexImage(source.yNeg, this._logger, gl, GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, format, type);
        this._size = updateTexImage(source.yPos, this._logger, gl, GL_TEXTURE_CUBE_MAP_POSITIVE_Y, format, type);
        this._size = updateTexImage(source.zNeg, this._logger, gl, GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, format, type);
        this._size = updateTexImage(source.zPos, this._logger, gl, GL_TEXTURE_CUBE_MAP_POSITIVE_Z, format, type);
        this._endDataUpdate(options);
    }
}

// @ts-ignore Initialize before constructor.
TextureCube.prototype._target = WebGL.TEXTURE_CUBE_MAP;
