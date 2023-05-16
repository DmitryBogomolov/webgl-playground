import type { Line } from './line/line';
import { Runtime } from 'lib';
import { State } from './state';
import { BevelLine } from './line/bevel';
import { RoundLine } from './line/round';
import { SearchTree } from './search-tree';
import { setupTracker } from './tracker';

/**
 * Line join.
 *
 * Shows "bevel" and "round" join types.
 * Bevel join is accomplished with vertex shader only but requires quite complex code.
 * Round join is accomplished by both vertex and fragment shaders. Code is simpler but fragment overhead exist.
 */
export type DESCRIPTION = never;

main();

interface LineConstructor<T extends Line> {
    new(runtime: Runtime): T;
}

function main(): void {
    const containerBevel = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-bevel')!;
    const containerRound = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-round')!;

    const state = new State();

    const runtimeBevel = new Runtime(containerBevel);
    const runtimeRound = new Runtime(containerRound);

    setupLine(runtimeBevel, state, BevelLine);
    setupLine(runtimeRound, state, RoundLine);

    const tree = new SearchTree(() => runtimeBevel.size(), state);

    setupTracker(runtimeBevel, tree, state);
    setupTracker(runtimeRound, tree, state);
}

function setupLine<T extends Line>(runtime: Runtime, state: State, ctor: LineConstructor<T>): T {
    const line = new ctor(runtime);
    runtime.frameRendered().on(() => {
        runtime.clearBuffer();
        line.render();
    });
    state.thicknessChanged.on(() => {
        line.setThickness(state.thickness);
        runtime.requestFrameRender();
    });
    state.verticesChanged.on(() => {
        line.setVertices(state.vertices);
        runtime.requestFrameRender();
    });
    state.vertexUpdated.on((idx) => {
        line.updateVertex(state.vertices, idx);
        runtime.requestFrameRender();
    });
    line.setVertices(state.vertices);
    line.setThickness(state.thickness);
    return line;
}
