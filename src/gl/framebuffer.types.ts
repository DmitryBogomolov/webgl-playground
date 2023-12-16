import type { Vec2 } from '../geometry/vec2.types';
import type { BaseObjectParams } from './base-object.types';
import type { Runtime } from './runtime';

export type FRAMEBUFFER_ATTACHMENT = ('color' | 'color|depth' | 'color|depth|stencil');

export type FramebufferRuntime = Pick<
    Runtime,
    'gl' | 'logger' | 'bindFramebuffer' | 'bindTexture' | 'bindRenderbuffer'
>;

export interface FramebufferParams extends BaseObjectParams {
    readonly runtime: FramebufferRuntime;
    readonly attachment: FRAMEBUFFER_ATTACHMENT;
    readonly useDepthTexture?: boolean;
    readonly size: Vec2;
}
