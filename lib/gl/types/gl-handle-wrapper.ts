export interface GLHandleWrapper<T> {
    id(): string;
    glHandle(): T;
}
