import type { EventProxy, EventHandler } from '../common/event-emitter.types';

export interface RenderLoopEvent {
    readonly delta: number;
    readonly timestamp: number;
}

export type RenderLoopEventHandler = EventHandler<[RenderLoopEvent]>;
export type RenderLoopEventProxy = EventProxy<[RenderLoopEvent]>;
