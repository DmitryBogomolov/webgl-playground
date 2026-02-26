import type { HttpRequestParams, HttpResponseInfo, HTTP_RESPONSE_TYPE } from './http_request.types';
import type { Mapping } from './mapping.types';

const RESPONSE_READERS: Mapping<HTTP_RESPONSE_TYPE, (response: Response) => unknown> = {
    binary: (response) => response.arrayBuffer(),
    text: (response) => response.text(),
    json: (response) => response.json(),
    blob: (response) => response.blob(),
};

export const DEFAULT_REQUEST_PARAMS: Required<HttpRequestParams> = Object.freeze({
    method: 'GET',
    contentType: 'binary',
});

export function httpRequest(url: string, params: HttpRequestParams = DEFAULT_REQUEST_PARAMS): HttpResponseInfo {
    const controller = new AbortController();
    const method = params.method ?? 'GET';
    const response = fetch(url, { method, signal: controller.signal }).then((response) => {
        if (!response.ok) {
            throw new Error(`${url}: ${response.statusText}`);
        }
        return RESPONSE_READERS[params.contentType ?? 'binary'](response);
    });
    return {
        response,
        cancel: () => controller.abort(),
    };
}
