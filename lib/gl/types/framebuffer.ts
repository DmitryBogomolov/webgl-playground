import type { GLWrapper } from './gl-wrapper';
import type { GLHandleWrapper } from './gl-handle-wrapper';
import type { Vec2 } from '../../geometry/types/vec2';

export type FRAMEBUFFER_ATTACHMENT = ('color' | 'color|depth' | 'color|depth|stencil');

export interface FramebufferOptions {
    readonly attachment: FRAMEBUFFER_ATTACHMENT;
    readonly useDepthTexture?: boolean;
    readonly size: Vec2;
}

export interface FramebufferRuntime extends GLWrapper {
    bindFramebuffer(framebuffer: GLHandleWrapper<WebGLFramebuffer> | null): void;
    bindRenderbuffer(renderbuffer: GLHandleWrapper<WebGLRenderbuffer> | null): void;
}
