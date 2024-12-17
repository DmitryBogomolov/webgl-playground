const searchParams = new URLSearchParams(location.search);

export function hasUrlParam(name: string): boolean {
    return searchParams.get(name) !== null;
}
