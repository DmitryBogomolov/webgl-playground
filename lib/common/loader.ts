export class Loader {
    constructor() {
    }

    dispose(): void {
    }

    async load(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`${url}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        return buffer;
    }

    cancel(_task: Promise<ArrayBuffer>): void {

    }
}
