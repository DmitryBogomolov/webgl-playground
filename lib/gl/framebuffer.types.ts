import type { Vec2 } from '../geometry/vec2.types';
import type { Runtime } from './runtime';

export type FRAMEBUFFER_ATTACHMENT = ('color' | 'color|depth' | 'color|depth|stencil');

export interface FramebufferOptions {
    readonly attachment: FRAMEBUFFER_ATTACHMENT;
    readonly useDepthTexture?: boolean;
    readonly size: Vec2;
}

export type FramebufferRuntime = Pick<
    Runtime,
    'gl' | 'bindFramebuffer' | 'bindRenderbuffer'
>;
