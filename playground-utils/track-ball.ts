import type { Vec2, Vec3 } from 'lib';
import { Tracker } from 'lib';

export interface TrackBallParams {
    readonly element: HTMLElement;
    readonly callback: (v: Vec3) => void;
    readonly initial?: Vec3;
}

export function trackBall(params: TrackBallParams): () => void {
    const tracker = new Tracker(params.element);
    let prevCoords: Vec2 | null = null;
    tracker.event('start').on((e) => {
        console.log('START', e.coords);
        prevCoords = e.coords;
    });
    tracker.event('move').on((e) => {
        console.log('MOVE', e.coords);
        prevCoords = e.coords;
    });
    tracker.event('end').on((e) => {
        prevCoords = null;
        console.log('END', e.coords);
    });
    return () => {
        tracker.dispose();
    };
}
