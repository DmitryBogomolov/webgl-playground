export interface DisposableContextProxy {
    add(target: { dispose(): void }): void;
}
