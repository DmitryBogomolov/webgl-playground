const { collect } = require('./collector');
const { runServer } = require('./server');

async function main() {
    try {
        const targets = await collect();
        await runServer(targets);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
