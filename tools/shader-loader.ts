import type { LoaderDefinitionFunction } from 'webpack';
import path from 'node:path';
import fs from 'node:fs/promises';

export default <LoaderDefinitionFunction> async function (source: string): Promise<string> {
    const pathIndex = new Map<string, number>();
    pathIndex.set(this.resourcePath, 0);
    return processSource(source, this.resourcePath, pathIndex).then(
        (combinedSource) => {
            for (const sourcePath of pathIndex.keys()) {
                this.addDependency(sourcePath);
            }
            return `export default ${JSON.stringify(combinedSource)}`;
        },
    );
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
            throw new Error(`include "${item.name}": not at the start of the line`);
        }
        if (path.isAbsolute(item.name)) {
            throw new Error(`include "${item.name}": absolute path`);
        }
        if (names.has(item.name)) {
            throw new Error(`include "${item.name}": duplicated`);
        }
        names.add(item.name);
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
    includes: ArrayLike<IncludeData>,
    subSources: ArrayLike<string>,
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
