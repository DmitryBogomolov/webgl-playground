import type { TextureImageData, TextureImageDataOptions, TextureRuntime } from './texture-2d.types';
import { TextureBase, textureImageDataToStr } from './texture-base';

const WebGL = WebGLRenderingContext.prototype;

export class Texture extends TextureBase {
    protected _bind(): void {
        (this._runtime as TextureRuntime).bindTexture(this);
    }

    setImageData(imageData: TextureImageData, options?: TextureImageDataOptions): void {
        if (!imageData) {
            throw this._logError('set_image_data: not defined');
        }
        this._logInfo(`set_image_data(${textureImageDataToStr(imageData)})`);
        const { format, type } = this._beginDataUpdate(options);
        this._updateData(imageData, this._target, format, type);
    }
}

// @ts-ignore Initialize before constructor.
Texture.prototype._target = WebGL.TEXTURE_2D;
