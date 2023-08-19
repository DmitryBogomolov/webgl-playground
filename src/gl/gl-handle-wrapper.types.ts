export interface GLHandleWrapper<T> {
    toString(): string;
    glHandle(): T;
}
