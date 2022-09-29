import type { TextureRuntime, TextureImageData } from './texture';
import type { GLHandleWrapper } from './gl-handle-wrapper';

export * from './texture';

export interface TextureCubeRuntime extends TextureRuntime {
    pixelStoreUnpackFlipYWebgl(unpackFlipYWebgl: boolean): void;
    bindCubeTexture(texture: GLHandleWrapper<WebGLTexture> | null): void;
}

export interface TextureCubeImageData {
    readonly xPos: TextureImageData;
    readonly xNeg: TextureImageData;
    readonly yPos: TextureImageData;
    readonly yNeg: TextureImageData;
    readonly zPos: TextureImageData;
    readonly zNeg: TextureImageData;
}
