import type { TextureRuntimeBase, TextureImageData } from './texture-base';
import type { Runtime } from '../runtime';

export * from './texture-base';

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
