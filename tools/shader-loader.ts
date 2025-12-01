import type { LoaderDefinitionFunction } from 'webpack';
import path from 'path';
import fs from 'fs/promises';

interface IncludeInfo {
    readonly line: number;
    readonly path: string;
    readonly start: number;
    readonly end: number;
}

interface SourceInfo {
    readonly id: number;
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
    return `export default ${JSON.stringify(combinedSource)}`;
};

const INCLUDE_PREFIX = '#include ';

function checkPattern(value: string, idx: number, pattern: string): boolean {
    return value.substring(idx, idx + pattern.length) === pattern;
}

function findIncludes(source: string): IncludeInfo[] {
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

async function traverseSource(
    source: string,
    filePath: string,
    sources: Map<string, SourceInfo>,
): Promise<void> {
    if (sources.has(filePath)) {
        return;
    }
    const fileDir = path.dirname(filePath);
    const includes = findIncludes(source).map((include): IncludeInfo => {
        const itemPath = path.resolve(fileDir, include.path);
        return {
            ...include,
            path: itemPath,
        };
    });
    sources.set(filePath, {
        id: sources.size,
        path: filePath,
        source: normalizeLastNewline(source),
        includes,
    });
    const itemTasks: Promise<void>[] = [];
    for (const include of includes) {
        const itemTask = fs.readFile(include.path, 'utf8')
            .then((itemSource) => traverseSource(itemSource, include.path, sources));
        itemTasks.push(itemTask);
    }
    await Promise.all(itemTasks);
}

function buildSourceItem(
    itemPath: string,
    sources: ReadonlyMap<string, SourceInfo>,
    mapping: SourceInfo[],
): string {
    const info = sources.get(itemPath)!;
    if (mapping.indexOf(info) === -1) {
        mapping.push(info);
    }
    const parts: string[] = [`#line 1 ${info.id}\n`];
    let cursor = 0;
    for (const include of info.includes) {
        parts.push(
            info.source.substring(cursor, include.start),
            buildSourceItem(include.path, sources, mapping),
            `#line ${include.line + 2} ${info.id}\n`,
        );
        cursor = include.end + 1;
    }
    parts.push(info.source.substring(cursor));
    return parts.join('');
}

function buildCombinedSource(filePath: string, sources: ReadonlyMap<string, SourceInfo>): string {
    const mapping: SourceInfo[] = [];
    const source = buildSourceItem(filePath, sources, mapping);
    if (mapping.length < 2) {
        return source;
    }
    const parts: string[] = [source, '\n// SOURCES_MAPPING\n'];
    for (const item of mapping) {
        parts.push(`// ${item.id} ${item.path}\n`);
    }
    return parts.join('');
}
