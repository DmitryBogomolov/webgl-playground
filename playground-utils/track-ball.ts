import type { Vec2, Vec3, Vec3Mut } from 'lib';
import { Tracker, spherical2zxy, clone2, vec3 } from 'lib';

export interface TrackBallParams {
    readonly element: HTMLElement;
    readonly callback: (v: Vec3) => void;
    readonly initial?: Vec3;
}

const X_PX_SENSE = 2 * Math.PI / 100;
const Y_PX_SENSE = Math.PI / 100;
const ELEVATION_EPS = Math.PI / 180 * 3;
const MAX_ELEVATION = +Math.PI / 2 - ELEVATION_EPS;
const MIN_ELEVATION = -Math.PI / 2 + ELEVATION_EPS;

export function trackBall(params: TrackBallParams): () => void {
    const tracker = new Tracker(params.element);
    let azimuth = 0;
    let elevation = 0;
    const distance = 4; // TODO...
    const vec = vec3(0, 0, 0) as Vec3Mut;
    spherical2zxy({ azimuth, elevation, distance }, vec);
    params.callback(vec);

    let prevCoords: Vec2 | null = null;
    tracker.event('start').on((e) => {
        if (e.nativeEvent.button !== 0) {
            return;
        }
        prevCoords = clone2(e.coords);
    });
    tracker.event('move').on((e) => {
        if (!prevCoords) {
            return;
        }
        const dx = e.coords.x - prevCoords.x;
        const dy = e.coords.y - prevCoords.y;
        prevCoords = clone2(e.coords);

        if (dx !== 0) {
            azimuth += dx * X_PX_SENSE;
            if (azimuth > +Math.PI) {
                azimuth -= Math.PI;
            }
            if (azimuth < -Math.PI) {
                azimuth += Math.PI;
            }
        }
        if (dy !== 0) {
            elevation += dy * Y_PX_SENSE;
            if (elevation > MAX_ELEVATION) {
                elevation = MAX_ELEVATION;
            }
            if (elevation < MIN_ELEVATION) {
                elevation = MIN_ELEVATION;
            }
        }
        spherical2zxy({ azimuth, elevation, distance }, vec);
        params.callback(vec);

    });
    tracker.event('end').on(() => {
        if (!prevCoords) {
            return;
        }
        prevCoords = null;
    });
    return () => {
        tracker.dispose();
    };
}
