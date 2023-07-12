export interface LoaderRequestOptions {
    readonly responseType?: LOADER_RESPONSE_TYPE;
}

export type LOADER_RESPONSE_TYPE = ('binary' | 'json' | 'text' | 'blob');
