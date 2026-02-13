import type { Vec2, Vec3, Vec3Mut } from 'lib';
import { Tracker, spherical2zxy, zxy2spherical, clone2, clone3, vec3, rad2deg } from 'lib';

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

    let prevCoords: Vec2 | null = null;
    let isSecondary = false;
    tracker.event('start').on((e) => {
        if (e.nativeEvent.button !== 0) {
            return;
        }
        prevCoords = clone2(e.coords);
        document.body.style.cursor = 'move';
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

        update();
    });
    tracker.event('end').on(() => {
        if (!prevCoords) {
            return;
        }
        reset();
    });

    function reset(): void {
        prevCoords = null;
        isSecondary = false;
        document.body.style.cursor = '';
    }

    function update(): void {
        spherical2zxy({ azimuth, elevation, distance }, vec);
        control.update(azimuth, elevation, (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE));
        params.callback(vec);
    }

    const control = createControl(params.element.parentElement!);
    update();

    return () => {
        reset();
        tracker.dispose();
        control.dispose();
    };
}

interface Control {
    dispose(): void;
    update(azimuth: number, elevation: number, distance: number): void;
}

function createControl(container: HTMLElement): Control {
    const size = 180;
    const r = size / 2;
    const pad = 4;
    const sizeAzimuth = Math.round(size / 10);
    const sizeElevation = sizeAzimuth;
    const sizeDistance = sizeAzimuth;
    const rAzimuth = r - pad - pad - sizeAzimuth / 2;
    const rElevation = rAzimuth - sizeAzimuth / 2 - pad;

    const root = document.createElement('div');
    root.className = 'track-ball';
    root.setAttribute('style', 'position: absolute; right: 0; top: 5%;');
    root.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${size}" height="${size}" viewBox="${-size / 2} ${-size / 2} ${size} ${size}"
            stroke="none" fill="none"
        >
            <circle
                cx="0" cy="0" r="${r - pad}"
                stroke="red" stroke-width="1"
            />
            <circle
                cx="0" cy="0" r="${r - pad - pad - sizeAzimuth - pad}"
                stroke="red" stroke-width="1"
            />
            <circle
                cx="0" cy="${rAzimuth}" r="${sizeAzimuth / 2}"
                fill="green"
                style="cursor: grab;"
            />
            <circle
                cx="0" cy="0" r="${sizeElevation / 2}"
                fill="green"
                style="cursor: grab;"
            />
            <rect
                x="${-sizeDistance / 4}" y="${-sizeDistance / 2}"
                width="${sizeDistance / 2}" height="${sizeDistance}"
                rx="4" ry="4"
                fill="green"
                style="cursor: grab;"
            />
        </svg>
    `;
    const elAz = root.firstElementChild!.children[2];
    const elEl = root.firstElementChild!.children[3];
    const elDist = root.firstElementChild!.children[4];

    const tracker = new Tracker(root);
    tracker.event('start').on((e) => {

    });
    tracker.event('move').on((e) => {

    });
    tracker.event('end').on((e) => {

    });

    container.appendChild(root);
    return {
        dispose: () => {
            root.remove();
            tracker.dispose();
        },

        update: (azimuth, elevation, distance) => {
            const angleAzimuth = rad2deg(-azimuth);
            elAz.setAttribute('transform', `rotate(${angleAzimuth})`);
            const positionElevation = -rElevation * Math.sin(elevation);
            const scaleElevation = 0.6 * Math.cos(elevation) + 0.4;
            elEl.setAttribute('transform', `translate(0 ${positionElevation}) scale(1 ${scaleElevation})`);
            const positionDistance = (distance * 2 - 1) * rElevation;
            elDist.setAttribute('transform', `translate(${positionDistance} 0)`);
        },
    };
}
