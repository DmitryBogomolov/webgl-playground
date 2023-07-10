export class DisposableContext {
    private readonly _targets: { dispose(): void }[] = [];

    add(target: { dispose(): void }): void {
        this._targets.push(target);
    }

    dispose(): void {
        for (const target of this._targets) {
            target.dispose();
        }
    }

    release(): void {
        this._targets.length = 0;
    }
}
