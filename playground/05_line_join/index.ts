import { Runtime } from 'lib';
import { State } from './state';
import { Line } from './line/line';
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

const containerBevel = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-bevel')!;
const containerRound = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-round')!;

const state = new State();

const runtimeBevel = new Runtime(containerBevel);
const runtimeRound = new Runtime(containerRound);

interface LineConstructor<T extends Line> {
    new(runtime: Runtime): T;
}

function setupLine<T extends Line>(runtime: Runtime, ctor: LineConstructor<T>): T {
    const line = new ctor(runtime);
    runtime.onRender(() => {
        runtime.clearColorBuffer();
        line.render();
    });
    state.thicknessChanged.on(() => {
        line.setThickness(state.thickness);
        runtime.requestRender();
    });
    state.verticesChanged.on(() => {
        line.setVertices(state.vertices);
        runtime.requestRender();
    });
    state.vertexUpdated.on((idx) => {
        line.updateVertex(state.vertices, idx);
        runtime.requestRender();
    });
    line.setVertices(state.vertices);
    line.setThickness(state.thickness);
    return line;
}

setupLine(runtimeBevel, BevelLine);
setupLine(runtimeRound, RoundLine);

const tree = new SearchTree(() => runtimeBevel.size());
tree.update(state.vertices);

state.verticesChanged.on(() => {
    tree.update(state.vertices);
});
state.vertexUpdated.on(() => {
    tree.update(state.vertices);
});

setupTracker(runtimeBevel, tree, state);
setupTracker(runtimeRound, tree, state);
