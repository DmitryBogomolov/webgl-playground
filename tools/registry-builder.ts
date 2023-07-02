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

async function checkDir(dirPath: string): Promise<Playground | null> {
    const name = path.basename(dirPath);
    const indexPath = path.join(dirPath, 'index.ts');
    const workerPath = path.join(dirPath, 'worker.ts');
    const markupPath = path.join(dirPath, 'markup.html');
    const [indexExists, workerExists, markupExists] = await Promise.all([
        fileExists(indexPath), fileExists(workerPath), fileExists(markupPath),
    ]);
    if (!indexExists) {
        return null;
    }
    return {
        name,
        title: capitalizeName(name),
        index: 'index.html',
        worker: workerExists ? 'worker.ts' : null,
        markup: markupExists ? 'markup.html' : null,
    };
}

async function main(): Promise<void> {
    await buildRegistry(path.join(__dirname, '../playground'), __dirname);
}

main().then(
    () => console.log('Done'),
    (err) => console.error(err),
);
