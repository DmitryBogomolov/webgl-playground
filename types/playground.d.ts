declare module '*.vert' {
    declare const data: string;
    export default data;
}

declare module '*.frag' {
    declare const data: string;
    export default data;
}

declare module '*.glsl' {
    declare const data: string;
    export default data;
}

declare module '*.css' {
    declare const data: Readonly<Record<string, string>>;
    export default data;
}

declare const PLAYGROUND_NAME: string;
declare const PLAYGROUND_ROOT: string;
declare const WORKER_URL: string;
