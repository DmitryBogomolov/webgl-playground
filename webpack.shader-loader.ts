import type {LoaderDefinitionFunction} from 'webpack';

export default <LoaderDefinitionFunction> async function (source: string): Promise<string> {
    console.log('@@@@@@@@@@@@@', this.context, this.currentRequest, this.loadModule);

    return `export default ${JSON.stringify(source)}`;
}

function findLineStarts(source: string): number[] {
    let k = 0;
    const lines: number[] = [0];
    while (true) {
        const i = source.indexOf('\n', k);
        if (i < 0) {
            break;
        }
        k = i + 1;
        lines.push(k);
    }
    return lines;
}

function findLineIndex(idx: number, lineStarts: ReadonlyArray<number>): number {
    let start = 0;
    let end = lineStarts.length - 1;
    while (end - start > 1) {
        const middle = (start + end) >> 1;
        if (idx >= lineStarts[middle]) {
            start = middle;
        } else {
            end = middle;
        }
    }
    return start;
}

export interface IncludeInfo {
    readonly line: number;
    readonly path: string;
}

export function findIncludes(source: string): IncludeInfo[] {
    const lineStarts = findLineStarts(source);
    const result: IncludeInfo[] = [];
    let k = 0;
    while (k < source.length) {
        const i = source.indexOf('//#include ', k);
        if (i < 0) {
            break;
        }
        const lineIdx = findLineIndex(i, lineStarts);
        k = lineStarts[lineIdx + 1] || source.length;
        const part = source.substring(i + '//#include'.length, k);
        result.push({ line: lineIdx, path: part.trim().split(' ')[0] });
    }
    return result;
}
