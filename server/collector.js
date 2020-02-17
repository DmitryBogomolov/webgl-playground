const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const PLAYGROUND_DIR = path.resolve('./playground');

function catchNoEnt(ret) {
    return ret.catch((e) => {
        if (e.code === 'ENOENT') {
            return null;
        }
        throw e;
    });
}

async function collect() {
    const directories = await readdir(PLAYGROUND_DIR);
    const records = await Promise.all(
        directories.map(async (dirName) => {
            const dirPath = path.join(PLAYGROUND_DIR, dirName);
            const indexPath = path.join(dirPath, 'index.js');
            const st = await catchNoEnt(stat(indexPath));
            return st.isFile() ? {
                name: dirName,
                indexPath,
            } : null;
        })
    );
    return records.filter(record => record);
}

module.exports = {
    collect,
};
