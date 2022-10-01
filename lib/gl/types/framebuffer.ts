import type { GLWrapper } from './gl-wrapper';
import type { GLHandleWrapper } from './gl-handle-wrapper';

export type FRAMEBUFFER_ATTACHMENT = ('color' | 'color|depth' | 'color|depth|stencil');

export interface FramebufferRuntime extends GLWrapper {
    bindFramebuffer(framebuffer: GLHandleWrapper<WebGLFramebuffer> | null): void;
    bindRenderbuffer(renderbuffer: GLHandleWrapper<WebGLRenderbuffer> | null): void;
}
