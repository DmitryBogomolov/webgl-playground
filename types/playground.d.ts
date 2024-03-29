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
    interface Fields {
        readonly [key: string]: string;
    }
    declare const data: Fields;
    export default data;
}

declare module 'worker-loader!*' {
    class LoadedWorker extends Worker {
        constructor();
    }
    export default LoadedWorker;
}

declare const PLAYGROUND_NAME: string;
declare const PLAYGROUND_ROOT: string;
declare const WORKER_URL: string;
