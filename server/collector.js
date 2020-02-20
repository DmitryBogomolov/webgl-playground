const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);

const PLAYGROUND_DIR = path.resolve('./playground');

async function collect() {
    const dirNames = await readdir(PLAYGROUND_DIR);
    return dirNames.map((dirName) => ({
        name: dirName,
        path: path.join(PLAYGROUND_DIR, dirName),
    }));
}

module.exports = {
    collect,
};
