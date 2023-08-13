import type { Mapping } from '../../common/mapping.types';
import type { Runtime } from '../../gl/runtime';
import type { PrimitiveWrapper } from './primitive.types';
import type { DisposableContextProxy } from '../../utils/disposable-context.types';
import { Program } from '../../gl/program';
import { LOCATIONS } from './attr-locations';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

interface ProgramInfo {
    readonly program: Program;
    refCount: number;
}

const cache = new Map<Runtime, Map<string, ProgramInfo>>();
const releasers = new Map<Program, () => void>();

function lockProgram(runtime: Runtime, description: Mapping<string, string>): Program {
    const collection = lockCollection(runtime);
    const key = getKey(description);
    const item = collection.get(key) || createProgram(runtime, collection, key, description);
    ++item.refCount;
    return item.program;
}

function createProgram(
    runtime: Runtime, collection: Map<string, ProgramInfo>, key: string, description: Mapping<string, string>,
): ProgramInfo {
    const program = new Program({
        runtime,
        vertShader: makeShaderSource(vertShader, description),
        fragShader: makeShaderSource(fragShader, description),
        locations: {
            'a_position': LOCATIONS.POSITION,
            'a_normal': LOCATIONS.NORMAL,
            'a_color': LOCATIONS.COLOR,
            'a_texcoord': LOCATIONS.TEXCOORD,
        },
    });
    const info: ProgramInfo = {
        program,
        refCount: 0,
    };
    collection.set(key, info);
    releasers.set(program, release);

    return info;

    function release(): void {
        --info.refCount;
        if (info.refCount === 0) {
            program.dispose();
            releasers.delete(program);
            collection.delete(key);
            if (collection.size === 0) {
                releaseCollection(runtime);
            }
        }
    }
}

function lockCollection(runtime: Runtime): Map<string, ProgramInfo> {
    let collection = cache.get(runtime);
    if (!collection) {
        collection = new Map();
        cache.set(runtime, collection);
    }
    return collection;
}

function releaseCollection(runtime: Runtime): void {
    cache.delete(runtime);
}

function getKey(description: Mapping<string, string>): string {
    return Object.entries(description).map(([key, val]) => `${key}:${val}`).join(';');
}

function releaseProgram(program: Program): void {
    releasers.get(program)!();
}

function makeShaderSource(source: string, definitions: Mapping<string, string>): string {
    const lines: string[] = [];
    for (const [key, val] of Object.entries(definitions)) {
        lines.push(`#define ${key} ${val}`);
    }
    lines.push('', '#line 1 0', source);
    return lines.join('\n');
}

export function createPrograms(
    wrappers: ReadonlyArray<PrimitiveWrapper>, runtime: Runtime, ctx: DisposableContextProxy,
): Program[] {
    const programs: Program[] = [];
    for (const wrapper of wrappers) {
        const program = lockProgram(runtime, wrapper.description);
        ctx.add({ dispose: () => { releaseProgram(program); } });
        wrapper.primitive.setProgram(program);
        programs.push(program);
    }
    return programs;
}

export function destroyPrograms(programs: ReadonlyArray<Program>): void {
    for (const program of programs) {
        releaseProgram(program);
    }
}
