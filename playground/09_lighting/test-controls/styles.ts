const stylesCache = new Set<string>();

export function makeStyles(key: string, content: string): void {
    if (stylesCache.has(key)) {
        return;
    }
    const style = document.createElement('style');
    style.innerHTML = content;
    document.querySelector('head')!.appendChild(style);
    stylesCache.add(key);
}
