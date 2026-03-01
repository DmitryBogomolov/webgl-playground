import type { HttpRequestParams, HttpResponseInfo, HTTP_RESPONSE_TYPE } from './http_request.types';
import type { Mapping } from './mapping.types';

const RESPONSE_READERS: Mapping<HTTP_RESPONSE_TYPE, (response: Response) => Promise<unknown>> = {
    binary: (response) => response.arrayBuffer(),
    text: (response) => response.text(),
    json: (response) => response.json(),
    blob: (response) => response.blob(),
};

export function httpRequest(url: string, params?: HttpRequestParams): HttpResponseInfo {
    const controller = new AbortController();
    const fetchConfig: RequestInit = {
        method: params?.method,
        credentials: params?.credentials,
        headers: params?.headers,
        body: params?.body,
        signal: controller.signal,
    };
    const response = fetch(url, fetchConfig).then((response) => {
        if (!response.ok) {
            throw new Error(`${url}: ${response.statusText}`);
        }
        return RESPONSE_READERS[params?.contentType ?? 'binary'](response).then(
            (data) => {
                controller.signal.throwIfAborted();
                return data;
            },
            (err) => {
                controller.signal.throwIfAborted();
                throw err;
            },
        );
    });
    return {
        task: response,
        cancel: () => controller.abort(),
    };
}
