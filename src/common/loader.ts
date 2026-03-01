import type { HttpRequestParams, HttpResponseInfo } from './http-request.types';
import { httpRequest } from './http-request';

export class Loader {
    private readonly _entries = new Map<string, Entry>();
    private readonly _tasks = new Map<Promise<unknown>, () => void>();

    dispose(): void {
        for (const request of Array.from(this._entries.values())) {
            request.cancel();
        }
        for (const task of Array.from(this._tasks.keys())) {
            this.cancel(task);
        }
    }

    private _createRequest(key: string, url: string, params: HttpRequestParams | undefined): Entry {
        const response = httpRequest(url, params);
        void response.task.finally(() => {
            this._entries.delete(key);
        });
        const entry: Entry = {
            response,
            cancel: (): void => {
                if (this._entries.has(key)) {
                    this._entries.delete(key);
                    response.cancel();
                }
            },
            refCount: 0,
        };
        this._entries.set(key, entry);
        return entry;
    }

    private _getRequest(url: string, params: HttpRequestParams | undefined): Entry {
        const key = `${params?.method ?? '-'}:${url}:${params?.contentType ?? '-'}`;
        return this._entries.get(key) || this._createRequest(key, url, params);
    }

    load<T>(url: string, params?: HttpRequestParams): Promise<T> {
        const entry = this._getRequest(url, params);
        let cancel!: () => void;
        const task = new Promise<unknown>((resolve, reject) => {
            cancel = () => {
                this._tasks.delete(task);
                entry.refCount -= 1;
                if (entry.refCount === 0) {
                    entry.cancel();
                }
            };
            entry.response.task.then(
                (data) => {
                    if (this._tasks.has(task)) {
                        cancel();
                        resolve(data);
                    }
                },
                (err) => {
                    if (this._tasks.has(task)) {
                        cancel();
                        reject(err);
                    }
                },
            );
            entry.refCount += 1;
        });
        this._tasks.set(task, cancel);
        return task as Promise<T>;
    }

    cancel(task: Promise<unknown>): void {
        const cancel = this._tasks.get(task);
        cancel?.();
    }
}

interface Entry {
    readonly response: HttpResponseInfo;
    readonly cancel: () => void;
    refCount: number;
}
