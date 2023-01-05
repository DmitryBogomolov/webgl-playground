import type { TextureRuntimeBase } from './texture-base.types';
import type { Runtime } from './runtime';

export * from './texture-base.types';

export type TextureRuntime = TextureRuntimeBase & Pick<
    Runtime,
    'bindTexture'
>;
