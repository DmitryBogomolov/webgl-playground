import type { LoaderRequestOptions, LOADER_REQUEST_METHOD, LOADER_RESPONSE_TYPE } from './loader.types';
import type { EventProxy } from './event-emitter.types';
import { EventEmitter } from './event-emitter';

export class Loader {
    private readonly _requests = new Map<string, Request>();
    private readonly _tasks = new Map<Promise<unknown>, () => void>();

    dispose(): void {
        for (const request of Array.from(this._requests.values())) {
            request.dispose();
        }
        for (const task of Array.from(this._tasks.keys())) {
            this.cancel(task);
        }
    }

    private _createRequest(
        key: string, url: string, method: LOADER_REQUEST_METHOD, responseType: LOADER_RESPONSE_TYPE,
    ): Request {
        const request = new Request(url, method, responseType);
        request.done().on(() => {
            this._requests.delete(key);
        })
        this._requests.set(key, request);
        return request;
    }

    private _getRequest(url: string, options: LoaderRequestOptions): Request {
        const method: LOADER_REQUEST_METHOD = options.method || 'GET';
        const responseType: LOADER_RESPONSE_TYPE = options.responseType || 'binary';
        const key = `${method}:${url}:${responseType}`;
        return this._requests.get(key) || this._createRequest(key, url, method, responseType);
    }

    load<T>(url: string, options: LoaderRequestOptions = {}): Promise<T> {
        const request = this._getRequest(url, options);
        let done!: () => void;
        let clean!: () => void;
        const task = new Promise<unknown>((resolve, reject) => {
            done = () => {
                clean();
                if (request.error()) {
                    reject(request.error());
                } else {
                    resolve(request.result());
                }
            };
            clean = () => {
                this._tasks.delete(task);
                request.done().off(done);
                request.release();
            };
        });
        request.done().on(done);
        request.lock();
        this._tasks.set(task, clean);
        return task as Promise<T>;
    }

    cancel(task: Promise<unknown>): void {
        const clean = this._tasks.get(task);
        if (clean) {
            clean();
        }
    }
}

const RESPONSE_READERS: Readonly<Record<LOADER_RESPONSE_TYPE, (response: Response) => unknown>> = {
    binary: (response) => response.arrayBuffer(),
    text: (response) => response.text(),
    json: (response) => response.json(),
    blob: (response) => response.blob(),
};

class Request {
    private readonly _ctrl = new AbortController();
    private readonly _done = new EventEmitter();
    private readonly _url: string;
    private readonly _method: LOADER_REQUEST_METHOD;
    private readonly _responseType: LOADER_RESPONSE_TYPE;
    private _count = 0;
    private _result: unknown | null = null;
    private _error: Error | null = null;

    constructor(url: string, method: LOADER_REQUEST_METHOD, responseType: LOADER_RESPONSE_TYPE) {
        this._url = url;
        this._method = method;
        this._responseType = responseType;
    }

    dispose(): void {
        this._cancel();
        this._done.clear();
    }

    done(): EventProxy {
        return this._done.proxy();
    }

    result<T = unknown>(): T {
        return this._result as T;
    }

    error(): Error | null {
        return this._error;
    }

    private _execute(): void {
        fetch(this._url, { method: this._method, signal: this._ctrl.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`${this._url}: ${response.statusText}`);
                }
                return RESPONSE_READERS[this._responseType](response);
            })
            .then(
                (result) => {
                    this._result = result;
                },
                (err) => {
                    this._error = err;
                },
            )
            .finally(() => {
                this._done.emit();
            });
    }

    private _cancel(): void {
        this._ctrl.abort();
    }

    lock(): void {
        if (this._count === 0) {
            this._execute();
        }
        ++this._count;
    }

    release(): void {
        --this._count;
        if (this._count === 0) {
            this._cancel();
        }
    }
}
