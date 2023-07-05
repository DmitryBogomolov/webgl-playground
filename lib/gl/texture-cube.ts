import type {
    TextureCubeRuntime, TextureCubeImageData, TextureImageDataOptions, TextureImageData,
} from './texture-cube.types';
import { TextureBase, textureImageDataToStr } from './texture-base';

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

    setImageData(imageData: TextureCubeImageData, options?: TextureImageDataOptions): void {
        if (!imageData) {
            throw this._logger.error('set_image_data: not defined');
        }
        this._logger.log('set_image_data({0})', imageDataToStr(imageData));
        const { format, type } = this._beginDataUpdate(options);
        this._updateData(imageData.xNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_X, format, type);
        this._updateData(imageData.xPos, GL_TEXTURE_CUBE_MAP_POSITIVE_X, format, type);
        this._updateData(imageData.yNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, format, type);
        this._updateData(imageData.yPos, GL_TEXTURE_CUBE_MAP_POSITIVE_Y, format, type);
        this._updateData(imageData.zNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, format, type);
        this._updateData(imageData.zPos, GL_TEXTURE_CUBE_MAP_POSITIVE_Z, format, type);
    }
}

// @ts-ignore Initialize before constructor.
TextureCube.prototype._target = WebGL.TEXTURE_CUBE_MAP;

function imageDataToStr(imageData: TextureCubeImageData): string {
    const parts = Object.entries(imageData)
        .map(([key, val]) => `${key}: ${textureImageDataToStr(val as TextureImageData)}`);
    return `image_data[${parts.join(', ')}]`;
}
