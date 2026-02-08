import type { Vec2, Vec3, Vec3Mut } from 'lib';
import { Tracker, spherical2zxy, zxy2spherical, clone2, clone3, vec3 } from 'lib';

export interface TrackBallParams {
    readonly element: HTMLElement;
    readonly callback: (v: Vec3) => void;
    readonly initial?: Vec3;
}

const DEFAULT = vec3(0, 0, 1);

const X_PX_SENSE = Math.PI / 180 / 4;
const Y_PX_SENSE = Math.PI / 180 / 4;
const DIST_PX_SENSE = 1 / 200;
const ELEVATION_EPS = Math.PI / 180 * 3;
const MAX_ELEVATION = +Math.PI / 2 - ELEVATION_EPS;
const MIN_ELEVATION = -Math.PI / 2 + ELEVATION_EPS;
const MIN_DISTANCE = 0.1;
const MAX_DISTANCE = 100;

export function trackBall(params: TrackBallParams): () => void {
    const tracker = new Tracker(params.element);

    const vec = clone3(params.initial ?? DEFAULT) as Vec3Mut;
    let { azimuth, elevation, distance } = zxy2spherical(params.initial ?? DEFAULT);
    params.callback(vec);

    let prevCoords: Vec2 | null = null;
    let isSecondary = false;
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
        if (e.nativeEvent.button === 2) {
            isSecondary = !isSecondary;
            prevCoords = clone2(e.coords);
            return;
        }

        const dx = e.coords.x - prevCoords.x;
        const dy = e.coords.y - prevCoords.y;
        prevCoords = clone2(e.coords);

        if (isSecondary) {
            distance += Math.sign(dx) * Math.hypot(dx, dy) * DIST_PX_SENSE;
            if (distance < MIN_DISTANCE) {
                distance = MIN_DISTANCE;
            }
            if (distance > MAX_DISTANCE) {
                distance = MAX_DISTANCE;
            }
        } else {
            azimuth += dx * X_PX_SENSE;
            if (azimuth > +Math.PI) {
                azimuth -= 2 * Math.PI;
            }
            if (azimuth < -Math.PI) {
                azimuth += 2 * Math.PI;
            }
            elevation += -dy * Y_PX_SENSE;
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
        isSecondary = false;
    });

    return () => {
        tracker.dispose();
    };
}
