import type { Vec2 } from 'lib';
import { vec2 } from 'lib';

const ALPHABET = Array('z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1)
    .fill(null)
    .map((_, i) => String.fromCharCode(i + 'a'.charCodeAt(0)));

const ATLAS_SIZE = 128;

export interface Glyph {
    readonly char: string;
    readonly size: Vec2;
    // Top-left glyph position in atlas; X goes right, Y goes down.
    readonly location: Vec2;
}

export interface GlyphAtlas {
    readonly glyphs: ReadonlyMap<number, Glyph>;
    readonly canvas: HTMLCanvasElement;
}

// Layout glyphs in square texture of ATLAS_SIZE*ATLAS_SIZE.
export function makeGlyphAtlas(fontSize: number): GlyphAtlas {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const font = `${fontSize}px Verdana`;
    ctx.font = font;
    const letterHeight = fontSize;
    let xOffset = 0;
    let yOffset = 0;
    const glyphs: Glyph[] = ALPHABET.map((char) => {
        const width = Math.ceil(ctx.measureText(char).width) + 1;
        if (xOffset + width > ATLAS_SIZE) {
            yOffset += letterHeight;
            xOffset = 0;
        }
        const location = vec2(xOffset, yOffset);
        const size = vec2(width, letterHeight);
        xOffset += width;
        return { char, size, location };
    });

    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.font = font;
    for (const { char, size, location } of glyphs) {
        ctx.fillText(char, location.x + size.x / 2, location.y + size.y / 2);
    }

    return {
        glyphs: new Map((glyphs).map((glyph) => [glyph.char.charCodeAt(0), glyph])),
        canvas,
    };
}
