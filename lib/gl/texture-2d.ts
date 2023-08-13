import type { TextureImageData, TextureImageDataOptions, TextureRuntime } from './texture-2d.types';
import { TextureBase, textureImageDataToStr } from './texture-base';

const WebGL = WebGLRenderingContext.prototype;

export class Texture extends TextureBase {
    protected _bind(): void {
        (this._runtime as TextureRuntime).bindTexture(this);
    }

    setImageData(imageData: TextureImageData, options?: TextureImageDataOptions): void {
        if (!imageData) {
            throw this._logger.error('set_image_data: not defined');
        }
        this._logger.info('set_image_data({0})', textureImageDataToStr(imageData));
        const { format, type } = this._beginDataUpdate(options);
        this._updateData(imageData, this._target, format, type);
    }
}

// @ts-ignore Initialize before constructor.
Texture.prototype._target = WebGL.TEXTURE_2D;
