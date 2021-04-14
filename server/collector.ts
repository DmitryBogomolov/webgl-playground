import path from 'path';
import fs from 'fs';

const { readdir,access } = fs.promises;
const { R_OK } = fs.constants;

const PLAYGROUND_DIR = path.resolve('./playground');

export interface Target {
    readonly name: string;
    readonly path: string;
    readonly hasWorker: boolean;
}

export async function collect(): Promise<Target[]> {
    const dirNames = await readdir(PLAYGROUND_DIR);
    return Promise.all(dirNames.map(async (dirName) => {
        const dirPath = path.join(PLAYGROUND_DIR, dirName);
        await access(path.join(dirPath, 'index.js'), R_OK);
        let hasWorker = false;
        try {
            await access(path.join(dirPath, 'worker.js'), R_OK);
            hasWorker = true;
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw err;
            }
        }
        return {
            name: dirName,
            path: dirPath,
            hasWorker,
        };
    }));
}
