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

// TODO: Try to use webpack-dev-server.

void main();
