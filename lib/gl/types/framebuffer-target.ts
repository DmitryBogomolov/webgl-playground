import type { GLHandleWrapper } from './gl-handle-wrapper';
import type { Vec2 } from '../../geometry/types/vec2';

export interface FramebufferTarget extends GLHandleWrapper<WebGLRenderbuffer> {
    size(): Vec2;
}
