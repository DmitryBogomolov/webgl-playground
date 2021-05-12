import {
    color,
    color2array,
    color2uint, uint2color,
    color2hex, hex2color,
} from './color';

describe('color', () => {
    it('create color', () => {
        expect(color(0.1, 0.2, 0.3, 0.4)).toEqual({ r: 0.1, g: 0.2, b: 0.3, a: 0.4 });
        expect(color(0.1, 0.2, 0.3)).toEqual({ r: 0.1, g: 0.2, b: 0.3, a: 1 });
    });

    it('make array from Color', () => {
        expect(color2array({ r: 0.1, g: 0.2, b: 0.3, a: 0.4 })).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it('make uint from Color', () => {
        expect(color2uint({ r: 0.6, g: 0.4, b: 0.2, a: 1 })).toEqual(0xFF336699);
    });

    it('make Color from uint', () => {
        expect(uint2color(0xFF336699)).toEqual({ r: 0.6, g: 0.4, b: 0.2, a: 1 });
    });

    it('make hex from Color', () => {
        expect(color2hex({ r: 0.6, g: 0.4, b: 0.2, a: 1 })).toEqual('#996633FF');
    });

    it('make Color from hex', () => {
        expect(hex2color('')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        expect(hex2color('996633')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        expect(hex2color('#996633FF')).toEqual({ r: 0.6, g: 0.4, b: 0.2, a: 1 });
        expect(hex2color('#996633')).toEqual({ r: 0.6, g: 0.4, b: 0.2, a: 1 });
        expect(hex2color('#963F')).toEqual({ r: 0.6, g: 0.4, b: 0.2, a: 1 });
        expect(hex2color('#963')).toEqual({ r: 0.6, g: 0.4, b: 0.2, a: 1 });
    });
});
