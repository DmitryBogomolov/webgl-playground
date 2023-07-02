import path from 'path';
import fs from 'fs';
import type { Playground } from './playground.types';

async function buildRegistry(playgroundRoot: string, registryRoot: string): Promise<void> {
    const names = await fs.promises.readdir(playgroundRoot);
    const objects = await Promise.all(names.map((item) => checkDir(path.join(playgroundRoot, item))));
    const content = JSON.stringify(objects.filter(Boolean), null, 4);
    await fs.promises.writeFile(path.join(registryRoot, 'playground-registry.json'), content, 'utf8');
}

function capitalizeWord(word: string): string {
    return word[0].toUpperCase() + word.slice(1);
}

function capitalizeName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\w\S*/g, capitalizeWord);
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await fs.promises.access(path, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

const INDEX_NAME = 'index.ts';
const WORKER_NAME = 'worker.ts';
const MARKUP_NAME = 'markup.html';

async function checkDir(dirPath: string): Promise<Playground | null> {
    const name = path.basename(dirPath);
    const indexPath = path.join(dirPath, INDEX_NAME);
    const workerPath = path.join(dirPath, WORKER_NAME);
    const markupPath = path.join(dirPath, MARKUP_NAME);
    const [indexExists, workerExists, markupExists] = await Promise.all([
        fileExists(indexPath), fileExists(workerPath), fileExists(markupPath),
    ]);
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
}

async function main(): Promise<void> {
    await buildRegistry(path.join(__dirname, '../playground'), __dirname);
}

main().catch(console.error);
