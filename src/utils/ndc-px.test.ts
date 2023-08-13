import { ndc2px, px2ndc } from './ndc-px';

describe('ndc-px', () => {
    it('convert ndc to px', () => {
        const size = { x: 640, y: 480 };
        expect(ndc2px({ x: 0, y: 0 }, size)).toBeVec2({ x: 320, y: 240 });
        expect(px2ndc({ x: 320, y: 240 }, size)).toBeVec2({ x: 0, y: 0 });
        expect(ndc2px({ x: -1, y: 1 }, size)).toBeVec2({ x: 0, y: 0 });
        expect(px2ndc({ x: 0, y: 0 }, size)).toBeVec2({ x: -1, y: 1 });
        expect(ndc2px({ x: 1, y: -1 }, size)).toBeVec2({ x: 640, y: 480 });
        expect(px2ndc({ x: 640, y: 480 }, size)).toBeVec2({ x: 1, y: -1 });
    });
});
