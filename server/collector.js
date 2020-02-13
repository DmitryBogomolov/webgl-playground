const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const PLAYGROUND_DIR = path.resolve('./playground');

async function collect() {
    const directories = await readdir(PLAYGROUND_DIR);
    const records = await Promise.all(
        directories.map(async (dirName) => {
            const dirPath = path.join(PLAYGROUND_DIR, dirName);
            const indexPath = path.join(dirPath, 'index.js');
            try {
                const st = await stat(indexPath);
                return st.isFile() ? {
                    name: dirName,
                    indexPath,
                } : null;
            } catch (e) {
                if (e.code === 'ENOENT') {
                    return null;
                }
                throw e;
            }
        })
    );
    return records.filter(record => record);
}

module.exports = {
    collect,
};
