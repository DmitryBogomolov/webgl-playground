const stylesCache = new Set<string>();

function makeStyles(key: string, content: string): void {
    if (stylesCache.has(key)) {
        return;
    }
    const style = document.createElement('style');
    style.innerHTML = content;
    document.querySelector('head')!.appendChild(style);
    stylesCache.add(key);
}

export abstract class BaseControl {
    protected readonly _root: HTMLDivElement;
    protected readonly _container: HTMLElement;

    constructor(container: HTMLElement) {
        this._root = document.createElement('div');
        this._root.className = this._initName();
        this._container = container;
        container.appendChild(this._root);
        makeStyles(this._root.className, this._initStyles());
    }

    dispose(): void {
        this._root.remove();
    }

    protected abstract _initName(): string;

    protected abstract _initStyles(): string;
}
