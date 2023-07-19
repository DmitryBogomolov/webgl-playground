import type { Mapping } from '../../common/mapping.types';

export function makeShaderSource(source: string, definitions: Mapping<string, string>): string {
    const lines: string[] = [];
    for (const [key, val] of Object.entries(definitions)) {
        lines.push(`#define ${key} ${val}`);
    }
    lines.push('', '#line 1 0', source);
    return lines.join('\n');
}
