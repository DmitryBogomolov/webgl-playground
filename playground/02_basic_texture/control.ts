import { color2hex } from 'lib';
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
    const xMin = 40;
    const xMax = width - 40;
    const yMin = 40;
    const yMax = height - 40;
    const dx = (xMax - xMin) / TEXTURE_SIZE;
    const dy = (yMax - yMin) / TEXTURE_SIZE;
    let { u, v } = initial;

    function handleDown(e: PointerEvent): void {
        document.addEventListener('pointerup', handleUp);
        document.addEventListener('pointermove', handleMove);
        process(e);
    }

    function handleUp(): void {
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointermove', handleMove);
    }

    function handleMove(e: PointerEvent): void {
        process(e);
    }

    function clamp(val: number, minVal: number, maxVal: number): number {
        if (val < minVal) {
            return minVal;
        }
        if (val > maxVal) {
            return maxVal;
        }
        return val;
    }

    function process(e: PointerEvent): void {
        const eventX = e.clientX - canvas.getBoundingClientRect().left;
        const eventY = e.clientY - canvas.getBoundingClientRect().top;
        u = clamp((eventX - xMin) / (xMax - xMin), 0, 1);
        v = clamp((eventY - yMax) / (yMin - yMax), 0, 1);
        draw();
        callback({ u, v });
    }

    canvas.addEventListener('pointerdown', handleDown);

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
