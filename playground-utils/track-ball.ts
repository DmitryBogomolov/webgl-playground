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
            distance += dx * DIST_PX_SENSE;
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

    const control = createControl();
    params.element.parentElement!.appendChild(control);

    return () => {
        tracker.dispose();
        control.remove();
    };
}

function createControl(): HTMLElement {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SIZE = 180;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const R = SIZE / 2 - 2;
    const D1 = R / 4 | 0;
    const root = document.createElement('div');
    root.className = 'track-ball';
    root.style.position = 'absolute';
    root.setAttribute('style', 'position: absolute; right: 0; top: 5%; padding: 4px;');
    root.innerHTML = `
        <svg xmlns="${SVG_NS}" width="${SIZE}" height="${SIZE}" stroke="none" fill="none">
            <circle cx="${CX}" cy="${CY}" r="${R}" stroke="red" stroke-width="1" />
            <circle cx="${CX}" cy="${CY}" r="${R - D1}" stroke="red" stroke-width="1" />
            <circle cx="${CX}" cy="${CY + R - D1 / 2}" r="${D1 / 2 - 2}" stroke="red" stroke-width="1" />
            <circle cx="${CX}" cy="${CY + R - D1 - D1 / 2}" r="${D1 / 2 - 2}" stroke="red" stroke-width="1" />
        </svg>
    `;
    return root;
}
