import type { TextureImageData, TextureImageDataOptions, TextureRuntime } from './texture-2d.types';
import { TextureBase } from './texture-base';

const WebGL = WebGL2RenderingContext.prototype;

export class Texture extends TextureBase {
    protected _bind(): void {
        (this._runtime as TextureRuntime).bindTexture(this);
    }

    setImageData(imageData: TextureImageData, options?: TextureImageDataOptions): void {
        if (!imageData) {
            throw this._logError_('set_image_data: data not defined');
        }
        this._logInfo_('set_image_data({0})', imageData);
        this._beginDataUpdate(options);
        this._updateData(imageData, this._target);
    }
}

// @ts-ignore Initialize before constructor.
Texture.prototype._target = WebGL.TEXTURE_2D;
