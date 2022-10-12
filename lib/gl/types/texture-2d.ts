import type { TextureRuntimeBase } from './texture-base';
import type { Runtime } from '../runtime';

export * from './texture-base';

export type TextureRuntime = TextureRuntimeBase & Pick<
    Runtime,
    'bindTexture'
>;
