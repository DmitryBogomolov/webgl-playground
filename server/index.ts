import { collect } from './collector';
import { runServer } from './server';

async function main(): Promise<void> {
    try {
        const targets = await collect();
        await runServer(targets);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// TODO: Move "src" to ts.
// TODO: Move tests to ts.
// TODO: Try to use webpack-dev-server.
// TODO: Add "--fix" to "lint" script.

void main();
