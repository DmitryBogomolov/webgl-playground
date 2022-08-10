export function throttle<T extends (...args: readonly unknown[]) => void>(func: T, duration: number): T {
    let timeout = 0;
    let lastTime = 0;
    let pendingArgs: Parameters<T> | null = null;
    function handler(): void {
        timeout = 0;
        lastTime = Date.now();
        func(...pendingArgs!);
        pendingArgs = null;
    }
    function throttledFunc(...args: Parameters<T>): void {
        const time = Date.now();
        const timespan = time - lastTime;
        if (timespan > duration) {
            lastTime = time;
            func(...args);
            return;
        }
        timeout = timeout || window.setTimeout(handler, duration - timespan);
        pendingArgs = args;
    }
    return throttledFunc as T;
}
