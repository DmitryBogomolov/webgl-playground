let next = 0;

const MAX = 0xFFFF;
const LEN = MAX.toString(16).length;

export function uniqueId(): string {
    const id = next + 1;
    next = (next + 1) % (MAX - 1);
    return id.toString(16).padStart(LEN, '0');
}
