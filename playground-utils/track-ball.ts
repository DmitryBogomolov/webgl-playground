import type { Vec2, Vec3, Vec3Mut, Spherical, SphericalMut } from 'lib';
import { Tracker, spherical2zxy, zxy2spherical, clone2, vec3, rad2deg } from 'lib';

export type DistanceParams = (
    | {
        readonly min: number;
        readonly max: number;
    }
    | {
        readonly fixed: number;
    }
);

export interface TrackBallParams {
    readonly element: HTMLElement;
    readonly callback: (v: Vec3) => void;
    readonly initial?: Vec3;
    readonly distance?: DistanceParams;
}

const PI = Math.PI;
const DBLPI = 2 * Math.PI;
const X_PX_SENSE = PI / 180 / 4;
const Y_PX_SENSE = PI / 180 / 4;
const ELEVATION_EPS = PI / 180 * 3;
const MIN_ELEVATION = -PI / 2 + ELEVATION_EPS;
const MAX_ELEVATION = +PI / 2 - ELEVATION_EPS;
const DIST_PX_SENSE = 1 / 100;
const CURSOR = 'move';

interface DistanceConfig {
    readonly min: number;
    readonly max: number;
    readonly isFixed: boolean;
}

const DEFAULT_DISTANCE_CONFIG: DistanceConfig = { min: 1, max: 100, isFixed: false };

export function trackBall(params: TrackBallParams): () => void {
    const tracker = new Tracker(params.element);

    const distanceConfig = makeDistanceConfig(params.distance);
    const coords = makeCoords(params.initial, distanceConfig);

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
        if (!distanceConfig.isFixed) {
            if (e.nativeEvent.button === 2) {
                isSecondary = !isSecondary;
                prevCoords = clone2(e.coords);
                return;
            }
        }

        const dx = e.coords.x - prevCoords.x;
        const dy = e.coords.y - prevCoords.y;
        prevCoords = clone2(e.coords);

        if (isSecondary) {
            setDistance(coords, distanceConfig, coords.distance + dx * DIST_PX_SENSE);
        } else {
            setAzimuth(coords, coords.azimuth + dx * X_PX_SENSE);
            setElevation(coords, coords.elevation + -dy * Y_PX_SENSE);
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
        setCursor('');
    }

    function update(): void {
        control.update(coords);
        params.callback(spherical2zxy(coords, _vec_scratch));
    }

    const control = createControl({
        container: params.element.parentElement!,
        distance: distanceConfig,
        notify: (change) => {
            if (change.azimuth !== undefined) {
                setAzimuth(coords, change.azimuth);
            }
            if (change.elevation !== undefined) {
                setElevation(coords, change.elevation);
            }
            if (change.distance !== undefined) {
                setDistance(coords, distanceConfig, change.distance);
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

function makeDistanceConfig(params: DistanceParams | undefined): DistanceConfig {
    if (!params) {
        return { ...DEFAULT_DISTANCE_CONFIG };
    }
    if ('fixed' in params) {
        if (params.fixed <= 0) {
            throw new Error(`params.distance.fixed: ${params.fixed}`);
        }
        return {
            min: params.fixed,
            max: params.fixed,
            isFixed: true,
        };
    } else {
        if (params.min <= 0) {
            throw new Error(`params.distance.min: ${params.min}`);
        }
        if (params.max <= params.min) {
            throw new Error(`params.distance.min: ${params.min}`);
        }
        return {
            min: params.min,
            max: params.max,
            isFixed: false,
        };
    }
}

function makeCoords(initial: Vec3 | undefined, distanceConfig: DistanceConfig): SphericalMut {
    const coords = { azimuth: 0, elevation: 0, distance: 1 } as SphericalMut;
    if (initial) {
        zxy2spherical(initial, coords);
    }
    setAzimuth(coords, coords.azimuth);
    setElevation(coords, coords.elevation);
    setDistance(coords, distanceConfig, coords.distance);
    return coords;
}

function setAzimuth(coords: SphericalMut, value: number): void {
    let azimuth = value;
    if (azimuth > +PI) {
        azimuth -= +azimuth / DBLPI | 0 * DBLPI;
    }
    if (azimuth < -Math.PI) {
        azimuth -= -azimuth / DBLPI | 0 * DBLPI;
    }
    coords.azimuth = azimuth;
}

function setElevation(coords: SphericalMut, value: number): void {
    let elevation = value;
    if (elevation > MAX_ELEVATION) {
        elevation = MAX_ELEVATION;
    }
    if (elevation < MIN_ELEVATION) {
        elevation = MIN_ELEVATION;
    }
    coords.elevation = elevation;
}

function setDistance(coords: SphericalMut, config: DistanceConfig, value: number): void {
    let distance = value;
    if (distance < config.min) {
        distance = config.min;
    }
    if (distance > config.max) {
        distance = config.max;
    }
    coords.distance = distance;
}

const _vec_scratch = vec3(0, 0, 0) as Vec3Mut;

interface ControlParams {
    readonly container: HTMLElement;
    readonly distance: DistanceConfig;
    readonly notify: (change: Partial<Spherical>) => void;
}

interface Control {
    dispose(): void;
    update(coords: Spherical): void;
}

type Fx = (x: number) => number;

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

    const packDist = packDistance(params.distance);
    const unpackDist = unpackDistance(params.distance);

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
    if (params.distance.isFixed) {
        elementDistance.remove();
    }

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
            params.notify({ distance: unpackDist(distance) });
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
            const positionDistance = (packDist(coords.distance) * 2 - 1) * rDistance;
            elementDistance.setAttribute('transform', `translate(${positionDistance} 0)`);
        },
    };
}

function setCursor(val: string): void {
    document.body.style.cursor = val;
}

function packDistance({ min, max }: DistanceConfig): Fx {
    return (t) => (t - min) / (max - min);
}

function unpackDistance({ min, max }: DistanceConfig): Fx {
    return (t) => (max - min) * t + min;
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
