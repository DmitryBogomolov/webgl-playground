import {
    TextureImageData, TextureImageDataOptions, TextureRuntime,
} from './types/texture';
import { TextureBase } from './texture-base';

const WebGL = WebGLRenderingContext.prototype;

export class Texture extends TextureBase {
    protected _bind(): void {
        (this._runtime as TextureRuntime).bindTexture(this);
    }

    setImageData(source: TextureImageData, options?: TextureImageDataOptions): void {
        this._logger.log('set_image_data({0})', source);
        const { format, type } = this._beginDataUpdate(options);
        this._updateData(source, this._target, format, type);
        this._endDataUpdate(options);
    }
}

// @ts-ignore Initialize before constructor.
Texture.prototype._target = WebGL.TEXTURE_2D;
