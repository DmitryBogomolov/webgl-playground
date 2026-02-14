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

    const control = createControl(params.element.parentElement!, (change) => {
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
    });
    update();

    return () => {
        reset();
        tracker.dispose();
        control.dispose();
    };
}

const _coords_scratch = { azimuth: 0, elevation: 0, distance: 0 } as SphericalMut;

interface Control {
    dispose(): void;
    update(coords: Spherical): void;
}

function createControl(
    container: HTMLElement,
    notify: (change: Partial<Spherical>) => void,
): Control {
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
    const svgRoot = root.querySelector<HTMLElement>('svg')!;
    const elementAzimuth = svgRoot.querySelector<HTMLElement>('[data-tag="azimuth"]')!;
    const elementElevation = svgRoot.querySelector<HTMLElement>('[data-tag="elevation"]')!;
    const elementDistance = svgRoot.querySelector<HTMLElement>('[data-tag="distance"]')!;

    let mode: 'azimuth' | 'elevation' | 'distance' | null = null;

    const tracker = new Tracker(svgRoot);
    tracker.event('start').on((e) => {
        switch (e.nativeEvent.target) {
        case elementAzimuth: {
            mode = 'azimuth';
            break;
        }
        case elementElevation: {
            mode = 'elevation';
            break;
        }
        case elementDistance: {
            mode = 'distance';
            break;
        }
        }
        if (mode !== null) {
            setCursor(CURSOR);
        }
    });
    tracker.event('move').on((e) => {
        switch (mode) {
        case 'azimuth': {
            const rect = svgRoot.getBoundingClientRect();
            const xc = (rect.right - rect.left) / 2;
            const yc = (rect.bottom - rect.top) / 2;
            const dx = e.coords.x - xc;
            const dy = e.coords.y - yc;
            const azimuth = Math.atan2(dx, dy);
            notify({ azimuth });
            break;
        }
        case 'elevation': {
            const rect = svgRoot.getBoundingClientRect();
            const yc = (rect.bottom - rect.top) / 2;
            const dy = clamp((e.coords.y - yc) / rElevation, -1, +1);
            const elevation = -Math.asin(dy);
            notify({ elevation });
            break;
        }
        case 'distance': {
            const rect = svgRoot.getBoundingClientRect();
            const xc = (rect.right - rect.left) / 2;
            const distance = clamp((e.coords.x - xc + rDistance) / (2 * rDistance), 0, 1);
            notify({ distance });
            break;
        }
        }
    });
    tracker.event('end').on(() => {
        setCursor('');
        mode = null;
    });

    container.appendChild(root);
    return {
        dispose: () => {
            root.remove();
            tracker.dispose();
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
