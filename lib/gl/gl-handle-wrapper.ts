import type { GLHandleWrapper } from './gl-handle-wrapper.types';

class GLHandleWrapperImpl<T> implements GLHandleWrapper<T> {
    private readonly _id: string;
    private readonly _handle: T;

    constructor(id: string, handle: T) {
        this._id = id;
        this._handle = handle;
    }

    id(): string {
        return this._id;
    }

    glHandle(): T {
        return this._handle;
    }
}

export function wrap<T>(id: string, handle: T): GLHandleWrapper<T> {
    return new GLHandleWrapperImpl(id, handle);
}
