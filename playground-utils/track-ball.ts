import type { Vec2, Vec3, Vec3Mut, Spherical, SphericalMut } from 'lib';
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
const CURSOR = 'move';

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
        setCursor(CURSOR);
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
            setDistance(distance + dx * DIST_PX_SENSE);
        } else {
            setAzimuth(azimuth + dx * X_PX_SENSE);
            setElevation(elevation + -dy * Y_PX_SENSE);
        }

        update();
    });
    tracker.event('end').on(() => {
        if (!prevCoords) {
            return;
        }
        reset();
    });

    function setAzimuth(value: number): void {
        azimuth = value;
        if (azimuth > +Math.PI) {
            azimuth -= 2 * Math.PI;
        }
        if (azimuth < -Math.PI) {
            azimuth += 2 * Math.PI;
        }
    }

    function setElevation(value: number): void {
        elevation = value;
        if (elevation > MAX_ELEVATION) {
            elevation = MAX_ELEVATION;
        }
        if (elevation < MIN_ELEVATION) {
            elevation = MIN_ELEVATION;
        }
    }

    function setDistance(value: number): void {
        distance = value;
        if (distance < MIN_DISTANCE) {
            distance = MIN_DISTANCE;
        }
        if (distance > MAX_DISTANCE) {
            distance = MAX_DISTANCE;
        }
    }

    function reset(): void {
        prevCoords = null;
        isSecondary = false;
        setCursor('');
    }

    function update(): void {
        const coords = _coords_scratch;
        coords.azimuth = azimuth;
        coords.elevation = elevation;
        coords.distance = distance;
        spherical2zxy(coords, vec);
        coords.distance = (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
        control.update(coords);
        params.callback(vec);
    }

    const control = createControl({
        container: params.element.parentElement!,
        notify: (change) => {
            if (change.azimuth !== undefined) {
                setAzimuth(change.azimuth);
            }
            if (change.elevation !== undefined) {
                setElevation(change.elevation);
            }
            if (change.distance !== undefined) {
                setDistance((MAX_DISTANCE - MIN_DISTANCE) * change.distance + MIN_DISTANCE);
            }
            update();
        },
    });
    update();

    return () => {
        reset();
        tracker.dispose();
        control.dispose();
    };
}

const _coords_scratch = { azimuth: 0, elevation: 0, distance: 0 } as SphericalMut;

interface ControlParams {
    readonly container: HTMLElement;
    readonly notify: (change: Partial<Spherical>) => void;
}

interface Control {
    dispose(): void;
    update(coords: Spherical): void;
}

function createControl(params: ControlParams): Control {
    const size = 180;
    const r = size / 2;
    const pad = 4;
    const sizeAzimuth = Math.round(size / 10);
    const sizeElevation = sizeAzimuth;
    const sizeDistance = sizeAzimuth;
    const rAzimuth = r - pad - pad - sizeAzimuth / 2;
    const rElevation = rAzimuth - sizeAzimuth / 2 - pad;
    const rDistance = rElevation;

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
                data-tag="azimuth"
                cx="0" cy="${rAzimuth}" r="${sizeAzimuth / 2}"
                fill="green"
                style="cursor: ${CURSOR};"
            />
            <circle
                data-tag="elevation"
                cx="0" cy="0" r="${sizeElevation / 2}"
                fill="green"
                style="cursor: ${CURSOR};"
            />
            <rect
                data-tag="distance"
                x="${-sizeDistance / 4}" y="${-sizeDistance / 2}"
                width="${sizeDistance / 2}" height="${sizeDistance}"
                rx="4" ry="4"
                fill="green"
                style="cursor: ${CURSOR};"
            />
        </svg>
    `;
    const elementRoot = root.querySelector<HTMLElement>('svg')!;
    const elementAzimuth = elementRoot.querySelector<HTMLElement>('[data-tag="azimuth"]')!;
    const elementElevation = elementRoot.querySelector<HTMLElement>('[data-tag="elevation"]')!;
    const elementDistance = elementRoot.querySelector<HTMLElement>('[data-tag="distance"]')!;

    type Handler = (coords: Vec2) => void;
    const handlers: Readonly<Record<string, Handler>> = {
        azimuth: (coords) => {
            const rect = elementRoot.getBoundingClientRect();
            const xc = (rect.right - rect.left) / 2;
            const yc = (rect.bottom - rect.top) / 2;
            const dx = coords.x - xc;
            const dy = coords.y - yc;
            const azimuth = Math.atan2(dx, dy);
            params.notify({ azimuth });
        },
        elevation: (coords) => {
            const rect = elementRoot.getBoundingClientRect();
            const yc = (rect.bottom - rect.top) / 2;
            const dy = clamp((coords.y - yc) / rElevation, -1, +1);
            const elevation = -Math.asin(dy);
            params.notify({ elevation });
        },
        distance: (coords) => {
            const rect = elementRoot.getBoundingClientRect();
            const xc = (rect.right - rect.left) / 2;
            const distance = clamp((coords.x - xc + rDistance) / (2 * rDistance), 0, 1);
            params.notify({ distance });
        },
    };
    let handler: Handler | null = null;

    const tracker = new Tracker(elementRoot);
    tracker.event('start').on((e) => {
        const { tag } = (e.nativeEvent.target as HTMLElement).dataset;
        handler = (handlers[tag as string] ?? null) as Handler | null;
        if (handler) {
            setCursor(CURSOR);
        }
    });
    tracker.event('move').on((e) => {
        if (handler) {
            handler(e.coords);
        }
    });
    tracker.event('end').on(() => {
        if (handler) {
            setCursor('');
            handler = null;
        }
    });

    params.container.appendChild(root);
    return {
        dispose: () => {
            tracker.dispose();
            root.remove();
        },

        update: (coords) => {
            const angleAzimuth = rad2deg(-coords.azimuth);
            elementAzimuth.setAttribute('transform', `rotate(${angleAzimuth})`);
            const positionElevation = -rElevation * Math.sin(coords.elevation);
            const scaleElevation = 0.6 * Math.cos(coords.elevation) + 0.4;
            elementElevation.setAttribute('transform', `translate(0 ${positionElevation}) scale(1 ${scaleElevation})`);
            const positionDistance = (coords.distance * 2 - 1) * rDistance;
            elementDistance.setAttribute('transform', `translate(${positionDistance} 0)`);
        },
    };
}

function setCursor(val: string): void {
    document.body.style.cursor = val;
}

function clamp(val: number, min: number, max: number): number {
    if (val <= min) {
        return min;
    }
    if (val >= max) {
        return max;
    }
    return val;
}
