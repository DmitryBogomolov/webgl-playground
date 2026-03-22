import type { Playground } from './playground.types';
import path from 'node:path';
import fs from 'node:fs/promises';

export function buildRegistry(playgroundRoot: string): Promise<Playground[]> {
    return fs.readdir(playgroundRoot)
        .then((names) => {
            const tasks = names.map((item) => {
                const dirPath = path.join(playgroundRoot, item);
                return checkDir(dirPath);
            });
            return Promise.all(tasks);
        })
        .then((playgrounds) =>
            playgrounds.filter(Boolean) as Playground[],
        );
}

function capitalizeWord(word: string): string {
    return word[0].toUpperCase() + word.slice(1);
}

function capitalizeName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\w\S*/g, capitalizeWord);
}

function fileExists(path: string): Promise<boolean> {
    return fs.access(path).then(() => true, () => false);
}

const INDEX_NAME = 'index.ts';
const WORKER_NAME = 'worker.ts';
const MARKUP_NAME = 'markup.html';

function checkDir(dirPath: string): Promise<Playground | null> {
    const name = path.basename(dirPath);
    const tasks = [INDEX_NAME, WORKER_NAME, MARKUP_NAME].map((name) => {
        const filePath = path.join(dirPath, name);
        return fileExists(filePath);
    });
    return Promise.all(tasks).then(([indexExists, workerExists, markupExists]) => {
        if (!indexExists) {
            return null;
        }
        return {
            name,
            title: capitalizeName(name),
            index: INDEX_NAME,
            worker: workerExists ? WORKER_NAME : null,
            markup: markupExists ? MARKUP_NAME : null,
        };
    });
}
