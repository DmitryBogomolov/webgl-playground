let nextId = 1;

export function generateId(name: string): string {
    return `${name}#${nextId++}`;
}
