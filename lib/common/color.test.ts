import {
    color, isColor,
    colorEq,
    color2uint, uint2color,
    color2hex, hex2color,
} from './color';

describe('color', () => {
    it('create color', () => {
        expect(color(0.1, 0.2, 0.3, 0.4)).toEqual({ r: 0.1, g: 0.2, b: 0.3, a: 0.4 });
        expect(color(0.1, 0.2, 0.3)).toEqual({ r: 0.1, g: 0.2, b: 0.3, a: 1 });
    });

    it('check color', () => {
        expect(isColor(null)).toBe(false);
        expect(isColor(undefined)).toBe(false);
        expect(isColor(0)).toBe(false);
        expect(isColor(1)).toBe(false);
        expect(isColor('color')).toBe(false);
        expect(isColor({ r: 1, g: 2, b: 3 })).toBe(false);
        expect(isColor({ r: 1, g: 2, b: 3, a: 4 })).toBe(true);
    });

    it('compare colors', () => {
        const c1 = color(1, 2, 3);
        const c2 = color(2, 3, 4);
        expect(colorEq(c1, c2)).toBe(false);
        expect(colorEq(c1, c1)).toBe(true);
        expect(colorEq(c2, c2)).toBe(true);
        expect(colorEq(c1, color(1, 2, 3))).toBe(true);
        expect(colorEq(color(2, 3, 4), c1)).toBe(false);
        expect(colorEq(color(2, 3, 4), c2)).toBe(true);
        expect(colorEq(c2, color(1, 2, 3))).toBe(false);
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
