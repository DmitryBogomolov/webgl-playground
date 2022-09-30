import type {
    TextureCubeRuntime, TextureCubeImageData, TextureImageDataOptions,
} from './types/texture-cube';
import { TextureBase } from './texture-base';

const WebGL = WebGLRenderingContext.prototype;

const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_X;
const GL_TEXTURE_CUBE_MAP_POSITIVE_X = WebGL.TEXTURE_CUBE_MAP_POSITIVE_X;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Y;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = WebGL.TEXTURE_CUBE_MAP_POSITIVE_Y;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Z;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = WebGL.TEXTURE_CUBE_MAP_POSITIVE_Z;

export class TextureCube extends TextureBase {
    constructor(runtime: TextureCubeRuntime, tag?: string) {
        super(runtime, tag);
    }

    protected _bind(): void {
        (this._runtime as TextureCubeRuntime).bindCubeTexture(this);
    }

    setImageData(source: TextureCubeImageData, options?: TextureImageDataOptions): void {
        this._logger.log('set_image_data({0})', source);
        const { format, type } = this._beginDataUpdate(options);
        this._updateData(source.xNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_X, format, type);
        this._updateData(source.xPos, GL_TEXTURE_CUBE_MAP_POSITIVE_X, format, type);
        this._updateData(source.yNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, format, type);
        this._updateData(source.yPos, GL_TEXTURE_CUBE_MAP_POSITIVE_Y, format, type);
        this._updateData(source.zNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, format, type);
        this._updateData(source.zPos, GL_TEXTURE_CUBE_MAP_POSITIVE_Z, format, type);
        this._endDataUpdate(options);
    }
}

// @ts-ignore Initialize before constructor.
TextureCube.prototype._target = WebGL.TEXTURE_CUBE_MAP;
