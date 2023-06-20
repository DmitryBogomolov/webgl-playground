import type {LoaderDefinitionFunction} from 'webpack';
import path from 'path';
import fs from 'fs/promises';

export interface SourceInfo {
    readonly path: string;
    readonly source: string;
    readonly includes: ReadonlyArray<IncludeInfo>;
}

export default <LoaderDefinitionFunction> async function (source: string): Promise<string> {
    const rootPath = this.resourcePath;
    const sources = new Map<string, SourceInfo>();
    await traverseSource(source, rootPath, sources);
    const combinedSource = buildCombinedSource(rootPath, sources);
    return `export default ${JSON.stringify(source || combinedSource)}`;
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
    readonly start: number;
    readonly end: number;
}

const INCLUDE_PREFIX = '//#include ';

export function findIncludes(source: string): IncludeInfo[] {
    const lineStarts = findLineStarts(source);
    const result: IncludeInfo[] = [];
    let k = 0;
    while (k < source.length) {
        const i = source.indexOf(INCLUDE_PREFIX, k);
        if (i < 0) {
            break;
        }
        const startIdx = i;
        const lineIdx = findLineIndex(i, lineStarts);
        const endIdx = lineIdx + 1 < lineStarts.length ? lineStarts[lineIdx + 1] : source.length;
        const part = source.substring(i + INCLUDE_PREFIX.length, endIdx);
        k = endIdx;
        result.push({ line: lineIdx, path: part.trim().split(' ')[0], start: startIdx, end: endIdx });
    }
    return result;
}

function normalizeLastNewline(source: string): string {
    return source[source.length - 1] === '\n' ? source : source + '\n';
}

export async function traverseSource(
    source: string, filePath: string, sources: Map<string, SourceInfo>,
): Promise<void> {
    if (sources.has(filePath)) {
        return;
    }
    const fileDir = path.dirname(filePath);
    const includes = findIncludes(source).map((include) => {
        const itemPath = path.resolve(fileDir, include.path);
        return {
            ...include,
            path: itemPath,
        };
    });
    sources.set(filePath, {
        path: filePath,
        source: normalizeLastNewline(source),
        includes,
    });
    const itemTasks: Promise<void>[] = [];
    for (const include of includes) {
        const itemTask = fs.readFile(include.path, 'utf8').then((itemSource) => {
            return traverseSource(itemSource, include.path, sources);
        });
        itemTasks.push(itemTask);
    }
    await Promise.all(itemTasks);
}

export function buildCombinedSource(filePath: string, sources: ReadonlyMap<string, SourceInfo>): string {
    const { source, includes } = sources.get(filePath)!;
    if (includes.length === 0) {
        return source;
    }
    const parts: string[] = [];
    let k = 0;
    for (const include of includes) {
        parts.push(source.substring(k, include.start));
        parts.push(buildCombinedSource(include.path, sources));
        k = include.end + 1;
    }
    parts.push(source.substring(k));
    return normalizeLastNewline(parts.join(''));
}
