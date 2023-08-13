import { makeEventCoordsGetter } from './pointer-event';

describe('pointer-event', () => {
    it('make coords getter', () => {
        const element = { getBoundingClientRect: () => ({ left: 400, top: 300 }) } as HTMLElement;
        const get = makeEventCoordsGetter(element);

        expect(get({ clientX: 640, clientY: 480 })).toEqual({ x: 240, y: 180 });
        expect(get({ clientX: 100, clientY: 200 })).toEqual({ x: -300, y: -100 });
    });
});
