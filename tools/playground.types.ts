export interface Playground {
    readonly name: string;
    readonly title: string;
    readonly index: string;
    readonly worker: string | null;
    readonly markup: string | null;
}

export interface Template {
    readonly name: string;
    readonly path: string;
}
