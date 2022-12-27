import type { Runtime } from '../gl/runtime';

export function takeCanvasSnapshot(runtime: Runtime): Promise<Blob> {
    return new Promise((resolve, reject) => {
        function handleFrame(): void {
            runtime.frameRendered().off(handleFrame);
            runtime.canvas().toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('failed to create blob'));
                }
            });
        }
        runtime.frameRendered().on(handleFrame);
        runtime.requestFrameRender();
    });
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    try {
        const element = document.createElement('a');
        element.href = url;
        element.download = filename;
        element.click();
    } finally {
        URL.revokeObjectURL(url);
    }
}
