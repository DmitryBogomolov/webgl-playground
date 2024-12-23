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
    protected readonly _NAME!: string;
    protected readonly _STYLES!: string;
    protected readonly _root: HTMLDivElement;
    protected readonly _container: HTMLElement;

    constructor(container: HTMLElement) {
        this._root = document.createElement('div');
        this._root.className = this._NAME;
        this._container = container;
        container.appendChild(this._root);
        makeStyles(this._NAME, this._STYLES);
    }

    dispose(): void {
    }
}
