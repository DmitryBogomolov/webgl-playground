import type { TextureRuntimeBase, TextureImageData } from './texture-base.types';
import type { Runtime } from './runtime';

export * from './texture-base.types';

export type TextureCubeRuntime = TextureRuntimeBase & Pick<
    Runtime,
    'bindCubeTexture'
>;

export interface TextureCubeImageData {
    readonly xPos: TextureImageData;
    readonly xNeg: TextureImageData;
    readonly yPos: TextureImageData;
    readonly yNeg: TextureImageData;
    readonly zPos: TextureImageData;
    readonly zNeg: TextureImageData;
}
