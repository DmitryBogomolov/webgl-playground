import type { TextureRuntimeBase } from './texture-base';
import { GLHandleWrapper } from './gl-handle-wrapper';

export * from './texture-base';

export interface TextureRuntime extends TextureRuntimeBase {
    bindTexture(texture: GLHandleWrapper<WebGLTexture> | null): void;
}
