import { getEventCoords } from './pointer-event';

describe('pointer-event', () => {
    it('get event coords', () => {
        const target = { getBoundingClientRect: () => ({ left: 400, top: 300 }) } as HTMLElement;

        expect(
            getEventCoords({ clientX: 640, clientY: 480, target } as unknown as MouseEvent),
        ).toEqual({ x: 240, y: 180 });
        expect(
            getEventCoords({ clientX: 100, clientY: 200, target } as unknown as MouseEvent),
        ).toEqual({ x: -300, y: -100 });
    });
});
