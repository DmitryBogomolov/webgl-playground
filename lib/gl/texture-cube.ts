import type {
    TextureRuntime,
} from './types/texture';
import type { Vec2 } from '../geometry/types/vec2';
import type { GLValuesMap } from './types/gl-values-map';
import type { GLHandleWrapper } from './types/gl-handle-wrapper';
import { Texture } from './texture';
import { vec2, ZERO2 } from '../geometry/vec2';

export class TextureCube extends Texture {
    constructor(runtime: TextureRuntime, tag?: string) {
        super(runtime, tag);
    }
}
