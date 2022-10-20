import {
    Vec2, vec2,
} from 'lib';

const ALPHABET = Array('z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1).fill(null)
    .map((_, i) => String.fromCharCode(i + 'a'.charCodeAt(0)));

const ATLAS_SIZE = 128;

export interface Glyph {
    readonly char: string;
    readonly size: Vec2;
    readonly coord: Vec2;
}

export interface GlyphAtlas {
    readonly glyphs: ReadonlyMap<number, Glyph>;
    readonly canvas: HTMLCanvasElement;
}

export function makeGlyphAtlas(fontSize: number): GlyphAtlas {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const font = `${fontSize}px Verdana`;
    ctx.font = font;
    const letterHeight = fontSize;
    let xOffset = 0;
    let yOffset = 0;
    const glyphs: Glyph[] = ALPHABET.map((ch) => {
        const width = Math.ceil(ctx.measureText(ch).width) + 1;
        if (xOffset + width > ATLAS_SIZE) {
            yOffset += letterHeight;
            xOffset = 0;
        }
        const glyph: Glyph = { char: ch, size: vec2(width, letterHeight), coord: vec2(xOffset, yOffset) };
        xOffset += width;
        return glyph;
    });

    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.font = font;

    for (const glyph of glyphs) {
        ctx.fillText(glyph.char, glyph.coord.x + glyph.size.x / 2, glyph.coord.y + glyph.size.y / 2);
    }

    return {
        glyphs: new Map((glyphs).map((glyph) => [glyph.char.charCodeAt(0), glyph])),
        canvas,
    };
}
