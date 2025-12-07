import type { LoaderDefinitionFunction } from 'webpack';
import path from 'path';
import fs from 'fs/promises';

// interface IncludeInfo {
//     readonly line: number;
//     readonly path: string;
//     readonly start: number;
//     readonly end: number;
// }

// interface SourceInfo {
//     readonly id: number;
//     readonly path: string;
//     readonly source: string;
//     readonly includes: ReadonlyArray<IncludeInfo>;
// }

export default <LoaderDefinitionFunction> async function (source: string): Promise<string> {
    // if (!source.includes(INCLUDE_PREFIX)) {
    //     this.addDependency(this.resourcePath);
    //     return `export default ${JSON.stringify(source)}`;
    // }

    // const rootPath = this.resourcePath;
    // const sources = new Map<string, SourceInfo>();
    // await traverseSource(source, rootPath, sources);
    // for (const src of sources.values()) {
    //     this.addDependency(src.path);
    // }
    // const combinedSource = buildCombinedSource(rootPath, sources);
    const pathIndex = new Map<string, number>();
    pathIndex.set(this.resourcePath, 0);
    return processSource(source, this.resourcePath, pathIndex).then(
        (combinedSource) => {
            for (const sourcePath of pathIndex.keys()) {
                this.addDependency(sourcePath);
            }
            console.log('@@@@', combinedSource);
            return `export default ${JSON.stringify(combinedSource)}`;
        },
    );
    // return `export default ${JSON.stringify(combinedSource)}`;
};

function processSource(source: string, sourcePath: string, pathIndex: Map<string, number>): Promise<string> {
    if (!source) {
        return Promise.resolve('');
    }
    const includes = collectIncludes(source, sourcePath);
    if (!includes.length) {
        return Promise.resolve(source);
    }
    return collectIncludeSources(includes, pathIndex).then(
        (subSources) => insertIncludes(source, sourcePath, includes, subSources, pathIndex),
    );
}

function enumerateLines(source: string): number[] {
    const lines = Array.from(source.matchAll(/\n/g), (match) => match.index! + 1);
    if (lines.at(-1) === source.length) {
        lines.pop();
    }
    lines.unshift(0);
    return lines;
}

const PATTERN = '#include "(.+?)"';

interface IncludeData {
    readonly name: string;
    readonly beginIdx: number;
    readonly endIdx: number;
    readonly lineNum: number;
    readonly path: string;
}

function collectIncludes(source: string, sourcePath: string): IncludeData[] {
    const re = new RegExp(PATTERN, 'g');
    const items = Array.from(source.matchAll(re), (match) => ({
        position: match.index!,
        name: match[1],
    }));
    if (!items.length) {
        return [];
    }
    const dirPath = path.dirname(sourcePath);
    const lines = enumerateLines(source);
    const names = new Set<string>();
    const result: IncludeData[] = [];
    for (const item of items) {
        const lineIdx = lines.indexOf(item.position);
        if (lineIdx < 0) {
            throw new Error(`include "${item.name}": must be at the start of the line`);
        }
        if (path.isAbsolute(item.name)) {
            throw new Error(`include "${item.name}": path must not be absolute`);
        }
        if (names.has(item.name)) {
            throw new Error(`include "${item.name}": duplicated`);
        }
        result.push({
            name: item.name,
            path: path.resolve(dirPath, item.name),
            beginIdx: lines[lineIdx],
            endIdx: lines[lineIdx + 1] ?? source.length,
            lineNum: lineIdx + 1,
        });
    }
    return result;
}

function processInclude(include: IncludeData, pathIndex: Map<string, number>): Promise<string> {
    if (pathIndex.has(include.path)) {
        return Promise.resolve(`// #include "${include.name}" // duplicate`);
    }
    pathIndex.set(include.path, pathIndex.size);
    return fs.readFile(include.path, 'utf8').then((source) => processSource(source, include.path, pathIndex));
}

function collectIncludeSources(
    includes: ReadonlyArray<IncludeData>,
    pathIndex: Map<string, number>,
): Promise<string[]> {
    let promise = Promise.resolve();
    const sources: string[] = [];
    includes.forEach((include) => {
        promise = promise.then(() =>
            processInclude(include, pathIndex).then((source) => {
                sources.push(source);
            }),
        );
    });
    return promise.then(() => sources);
}

function insertIncludes(
    source: string,
    sourcePath: string,
    includes: ReadonlyArray<IncludeData>,
    subSources: ReadonlyArray<string>,
    pathIndex: ReadonlyMap<string, number>,
): string {
    const parts: string[] = [];
    const firstPart = source.substring(0, includes[0].beginIdx);
    if (firstPart.length > 0) {
        parts.push(firstPart);
    }
    for (let i = 0; i < includes.length; ++i) {
        const include = includes[i];
        parts.push(
            `#line 1 ${pathIndex.get(include.path)} // ${include.path}\n`,
            subSources[i],
            '\n',
            `#line ${include.lineNum + 1} ${pathIndex.get(sourcePath)} // ${sourcePath}\n`,
        );
        const nextPart = source.substring(include.endIdx, includes[i + 1]?.beginIdx ?? source.length);
        if (nextPart.length > 0) {
            parts.push(nextPart);
        }
    }
    return parts.join('');
}

// const INCLUDE_PREFIX = '#include ';

// function checkPattern(value: string, idx: number, pattern: string): boolean {
//     return value.substring(idx, idx + pattern.length) === pattern;
// }

// function findIncludes(source: string): IncludeInfo[] {
//     let lineCount = 0;
//     let cursor = 0;
//     const result: IncludeInfo[] = [];
//     while (cursor < source.length) {
//         let end = source.indexOf('\n', cursor);
//         if (end === -1) {
//             end = source.length;
//         }
//         if (checkPattern(source, cursor, INCLUDE_PREFIX)) {
//             const ref = source.substring(cursor + INCLUDE_PREFIX.length, end).trim();
//             result.push({ line: lineCount, path: ref, start: cursor, end });
//         }
//         cursor = end + 1;
//         ++lineCount;
//     }
//     return result;
// }

// function normalizeLastNewline(source: string): string {
//     return source[source.length - 1] === '\n' ? source : source + '\n';
// }

// async function traverseSource(
//     source: string,
//     filePath: string,
//     sources: Map<string, SourceInfo>,
// ): Promise<void> {
//     if (sources.has(filePath)) {
//         return;
//     }
//     const fileDir = path.dirname(filePath);
//     const includes = findIncludes(source).map((include): IncludeInfo => {
//         const itemPath = path.resolve(fileDir, include.path);
//         return {
//             ...include,
//             path: itemPath,
//         };
//     });
//     sources.set(filePath, {
//         id: sources.size,
//         path: filePath,
//         source: normalizeLastNewline(source),
//         includes,
//     });
//     const itemTasks: Promise<void>[] = [];
//     for (const include of includes) {
//         const itemTask = fs.readFile(include.path, 'utf8')
//             .then((itemSource) => traverseSource(itemSource, include.path, sources));
//         itemTasks.push(itemTask);
//     }
//     await Promise.all(itemTasks);
// }

// function buildSourceItem(
//     itemPath: string,
//     sources: ReadonlyMap<string, SourceInfo>,
//     mapping: SourceInfo[],
// ): string {
//     const info = sources.get(itemPath)!;
//     if (mapping.indexOf(info) === -1) {
//         mapping.push(info);
//     }
//     const parts: string[] = [`#line 1 ${info.id}\n`];
//     let cursor = 0;
//     for (const include of info.includes) {
//         parts.push(
//             info.source.substring(cursor, include.start),
//             buildSourceItem(include.path, sources, mapping),
//             `#line ${include.line + 2} ${info.id}\n`,
//         );
//         cursor = include.end + 1;
//     }
//     parts.push(info.source.substring(cursor));
//     return parts.join('');
// }

// function buildCombinedSource(filePath: string, sources: ReadonlyMap<string, SourceInfo>): string {
//     const mapping: SourceInfo[] = [];
//     const source = buildSourceItem(filePath, sources, mapping);
//     if (mapping.length < 2) {
//         return source;
//     }
//     const parts: string[] = [source, '\n// SOURCES_MAPPING\n'];
//     for (const item of mapping) {
//         parts.push(`// ${item.id} ${item.path}\n`);
//     }
//     return parts.join('');
// }
