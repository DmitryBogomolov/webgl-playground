import { color2hex, vec2, linearMapping, Tracker, Vec2 } from 'lib';
import { TEXTURE_SIZE, pixels } from './image';

export interface TexCoord {
    readonly u: number;
    readonly v: number;
}

export function makeControl(initial: TexCoord, callback: (tc: TexCoord) => void): void {
    const canvas = document.querySelector<HTMLCanvasElement>('#control-canvas')!;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;
    const size = Math.min(width, height) - 80;
    const xMin = width / 2 - size / 2;
    const xMax = width / 2 + size / 2;
    const yMin = height / 2 - size / 2;
    const yMax = height / 2 + size / 2;
    const dx = (xMax - xMin) / TEXTURE_SIZE;
    const dy = (yMax - yMin) / TEXTURE_SIZE;
    let { u, v } = initial;

    function clamp(val: number, minVal: number, maxVal: number): number {
        if (val < minVal) {
            return minVal;
        }
        if (val > maxVal) {
            return maxVal;
        }
        return val;
    }

    new Tracker(canvas, {
        onStart({ coords }) {
            process(coords);
        },
        onMove({ coords }) {
            process(coords);
        },
    });
    const mapX = linearMapping(xMin, xMax, 0, 1);
    const mapY = linearMapping(yMax, yMin, 0, 1);
    function mapCoords({ x, y }: Vec2): Vec2 {
        return vec2(mapX(x), mapY(y));
    }

    function process(coords: Vec2): void {
        const { x, y } = mapCoords(coords);
        u = clamp(x, 0, 1);
        v = clamp(y, 0, 1);
        draw();
        callback({ u, v });
    }

    function draw(): void {
        ctx.clearRect(0, 0, width, height);
        for (let row = 0; row < TEXTURE_SIZE; ++row) {
            for (let col = 0; col < TEXTURE_SIZE; ++col) {
                const clr = pixels[row * TEXTURE_SIZE + col];
                ctx.fillStyle = color2hex(clr);
                ctx.fillRect(xMin + col * dx, yMin + row * dy, dx, dy);
            }
        }
        const xC = (1 - u) * xMin + u * xMax;
        const yC = (1 - v) * yMax + v * yMin;
        ctx.beginPath();
        ctx.moveTo(xC - 10, yC);
        ctx.lineTo(xC, yC - 10);
        ctx.lineTo(xC + 10, yC);
        ctx.lineTo(xC, yC + 10);
        ctx.closePath();
        ctx.fillStyle = '#7f7f7f';
        ctx.fill();
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(u.toFixed(2), xC, yMin);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(2), xMax, yC);
    }

    draw();
}
