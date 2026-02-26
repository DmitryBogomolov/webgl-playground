export type HTTP_REQUEST_METHOD = ('GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE');
export type HTTP_RESPONSE_TYPE = ('binary' | 'json' | 'text' | 'blob');

export interface HttpRequestParams {
    readonly method?: HTTP_REQUEST_METHOD;
    readonly contentType?: HTTP_RESPONSE_TYPE;
}

export interface HttpResponseInfo {
    readonly response: Promise<unknown>;
    readonly cancel: () => void;
}
