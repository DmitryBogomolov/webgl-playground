import type { Vec2 } from '../geometry/vec2.types';
import type { Runtime } from './runtime';

export type FRAMEBUFFER_ATTACHMENT = ('color' | 'color|depth' | 'color|depth|stencil');

export type FramebufferRuntime = Pick<
    Runtime,
    'gl' | 'log' | 'bindFramebuffer' | 'bindFramebufferRaw' | 'bindTexture' | 'bindRenderbuffer'
>;

export interface FramebufferParams {
    readonly tag?: string;
    readonly runtime: FramebufferRuntime;
    readonly attachment: FRAMEBUFFER_ATTACHMENT;
    readonly useDepthTexture?: boolean;
    readonly size: Vec2;
}
