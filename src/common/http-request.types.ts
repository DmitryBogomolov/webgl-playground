export type HTTP_REQUEST_METHOD = ('GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE');
export type HTTP_REQUEST_CREDENTIALS = ('include' | 'omit' | 'same-origin');
export type HTTP_REQUEST_HEADERS = Readonly<Record<string, string>>;
export type HTTP_REQUEST_BODY = string | BufferSource;
export type HTTP_RESPONSE_TYPE = ('binary' | 'json' | 'text' | 'blob');

export interface HttpRequestParams {
    readonly method?: HTTP_REQUEST_METHOD;
    readonly credentials?: HTTP_REQUEST_CREDENTIALS;
    readonly headers?: HTTP_REQUEST_HEADERS;
    readonly body?: HTTP_REQUEST_BODY;
    readonly contentType?: HTTP_RESPONSE_TYPE;
}

export interface HttpResponseInfo {
    readonly task: Promise<unknown>;
    readonly cancel: () => void;
}
