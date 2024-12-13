import type { LineBase } from './line/line';
import { Runtime, colors } from 'lib';
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

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime({ element: container });

    const state = new State();

    const bevelLine = new BevelLine(runtime, colors.BLUE);
    const roundLine = new RoundLine(runtime, colors.GREEN);
    setupLine(bevelLine, runtime, state, 1);
    setupLine(roundLine, runtime, state, 0.5);

    const tree = new SearchTree(runtime, state);

    setupTracker(runtime, tree, state);

    runtime.frameRequested().on(() => {
        runtime.clearBuffer();
        bevelLine.render();
        roundLine.render();
    });
}

function setupLine(line: LineBase, runtime: Runtime, state: State, thicknessFactor: number): void {
    state.thicknessChanged.on(() => {
        line.setThickness(state.thickness * thicknessFactor);
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
    line.setThickness(state.thickness * thicknessFactor);
}
