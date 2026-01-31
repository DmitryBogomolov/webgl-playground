import type {
    TextureCubeRuntime, TextureCubeImageData, TextureImageDataOptions,
} from './texture-cube.types';
import { TextureBase } from './texture-base';

const WebGL = WebGL2RenderingContext.prototype;

const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_X;
const GL_TEXTURE_CUBE_MAP_POSITIVE_X = WebGL.TEXTURE_CUBE_MAP_POSITIVE_X;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Y;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = WebGL.TEXTURE_CUBE_MAP_POSITIVE_Y;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Z;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = WebGL.TEXTURE_CUBE_MAP_POSITIVE_Z;

export class TextureCube extends TextureBase {
    protected _bind(): void {
        (this._runtime as TextureCubeRuntime).bindCubeTexture(this);
    }

    setImageData(imageData: TextureCubeImageData, options?: TextureImageDataOptions): void {
        if (!imageData) {
            throw this._logError_('set_image_data: data not defined');
        }
        this._logInfo_('set_image_data({0})', imageData);
        this._beginDataUpdate(options);
        this._updateData(imageData.xNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_X);
        this._updateData(imageData.xPos, GL_TEXTURE_CUBE_MAP_POSITIVE_X);
        this._updateData(imageData.yNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_Y);
        this._updateData(imageData.yPos, GL_TEXTURE_CUBE_MAP_POSITIVE_Y);
        this._updateData(imageData.zNeg, GL_TEXTURE_CUBE_MAP_NEGATIVE_Z);
        this._updateData(imageData.zPos, GL_TEXTURE_CUBE_MAP_POSITIVE_Z);
    }
}

// @ts-ignore Initialize before constructor.
TextureCube.prototype._target = WebGL.TEXTURE_CUBE_MAP;
