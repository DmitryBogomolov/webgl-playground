export interface LoaderRequestOptions {
    readonly method?: LOADER_REQUEST_METHOD;
    readonly responseType?: LOADER_RESPONSE_TYPE;
}

export type LOADER_REQUEST_METHOD = ('GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE');
export type LOADER_RESPONSE_TYPE = ('binary' | 'json' | 'text' | 'blob');
