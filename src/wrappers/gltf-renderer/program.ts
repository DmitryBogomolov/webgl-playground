import type { Mapping } from '../../common/mapping.types';
import type { Runtime } from '../../gl/runtime';
import type { PrimitiveWrapper } from './primitive.types';
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
    runtime: Runtime,
    collection: Map<string, ProgramInfo>,
    key: string,
    defines: Mapping<string, string>,
): ProgramInfo {
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
        defines,
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

export function createPrograms(wrappers: Iterable<PrimitiveWrapper>, runtime: Runtime): Program[] {
    const programs: Program[] = [];
    for (const wrapper of wrappers) {
        const program = lockProgram(runtime, wrapper.description);
        wrapper.primitive.setProgram(program);
        programs.push(program);
    }
    return programs;
}

export function destroyPrograms(programs: Iterable<Program>): void {
    for (const program of programs) {
        releaseProgram(program);
    }
}
