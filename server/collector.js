const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const access = promisify(fs.access);

const PLAYGROUND_DIR = path.resolve('./playground');

async function collect() {
    const dirNames = await readdir(PLAYGROUND_DIR);
    return Promise.all(dirNames.map(async (dirName) => {
        const dirPath = path.join(PLAYGROUND_DIR, dirName);
        await access(path.join(dirPath, 'index.js'), fs.constants.R_OK);
        let hasWorker = false;
        try {
            await access(path.join(dirPath, 'worker.js'), fs.constants.R_OK);
            hasWorker = true;
        } catch (err) {
            if (err.code !== 'ENOENT') {
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

module.exports = {
    collect,
};
