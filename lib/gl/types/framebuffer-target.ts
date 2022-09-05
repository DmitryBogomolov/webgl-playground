import { GLHandleWrapper } from './gl-handle-wrapper';
import { Vec2 } from '../../geometry/types/vec2';

export interface FramebufferTarget extends GLHandleWrapper<WebGLRenderbuffer> {
    size(): Vec2;
}
