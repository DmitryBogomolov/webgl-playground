const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const PLAYGROUND_DIR = path.join(__dirname, '../playground');

async function collect() {
    let items = await readdir(PLAYGROUND_DIR);
    items = await Promise.all(items.map(async (item) => {
        const dirPath = path.join(PLAYGROUND_DIR, item);
        const indexPath = path.join(dirPath, 'index.js');
        try {
            const st = await stat(indexPath);
            return st.isFile() ? {
                name: item,
                indexPath,
            } : null;
        } catch (e) {
            if (e.code === 'ENOENT') {
                return null;
            }
            throw e;
        }
    }));
    return items.filter(item => item);
}

exports.collect = collect;
