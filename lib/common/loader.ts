export class Loader {
    private readonly _pending: Map<string, Promise<ArrayBuffer>> = new Map();
    private readonly _tasks: Set<Promise<ArrayBuffer>> = new Set();

    dispose(): void {
        for (const task of Array.from(this._tasks)) {
            this.cancel(task);
        }
    }

    load(url: string): Promise<ArrayBuffer> {
        let pending = this._pending.get(url);
        if (!pending) {
            pending = execute(url).finally(() => {
                this._pending.delete(url);
            });
            this._pending.set(url, pending);
        }
        const task = new Promise<ArrayBuffer>((resolve, reject) => {
            pending!.then(
                (res) => {
                    if (this._tasks.has(task)) {
                        this._tasks.delete(task);
                        resolve(res);
                    }
                },
                (err) => {
                    if (this._tasks.has(task)) {
                        this._tasks.delete(task);
                        reject(err);
                    }
                },
            );
        });
        this._tasks.add(task);
        return task;
    }

    cancel(task: Promise<ArrayBuffer>): void {
        this._tasks.delete(task);
    }
}

async function execute(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return buffer;
}
