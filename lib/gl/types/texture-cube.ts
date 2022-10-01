import type { TextureRuntimeBase, TextureImageData } from './texture-base';
import type { GLHandleWrapper } from './gl-handle-wrapper';

export * from './texture-base';

export interface TextureCubeRuntime extends TextureRuntimeBase {
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
