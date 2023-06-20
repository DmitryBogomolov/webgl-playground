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
    for (const src of sources.values()) {
        this.addDependency(src.path);
    }
    const combinedSource = buildCombinedSource(rootPath, sources);
    console.log(combinedSource);
    return `export default ${JSON.stringify(combinedSource)}`;
}

export interface IncludeInfo {
    readonly line: number;
    readonly path: string;
    readonly start: number;
    readonly end: number;
}

const INCLUDE_PREFIX = '//#include ';

function checkPattern(value: string, idx: number, pattern: string): boolean {
    return value.substring(idx, idx + pattern.length) === pattern;
}

export function findIncludes(source: string): IncludeInfo[] {
    let lineCount = 0;
    let cursor = 0;
    const result: IncludeInfo[] = [];
    while (cursor < source.length) {
        let end = source.indexOf('\n', cursor);
        if (end === -1) {
            end = source.length;
        }
        if (checkPattern(source, cursor, INCLUDE_PREFIX)) {
            const ref = source.substring(cursor + INCLUDE_PREFIX.length, end).trim();
            result.push({ line: lineCount, path: ref, start: cursor, end });
        }
        cursor = end + 1;
        ++lineCount;
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
    let cursor = 0;
    for (const include of includes) {
        parts.push(source.substring(cursor, include.start));
        parts.push(buildCombinedSource(include.path, sources));
        cursor = include.end + 1;
    }
    parts.push(source.substring(cursor));
    return normalizeLastNewline(parts.join(''));
}
