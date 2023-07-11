import { Loader } from './loader';

describe('loader', () => {
    describe('Loader', () => {
        let fetch: jest.SpyInstance;

        beforeEach(() => {
            fetch = jest.fn();
            // @ts-ignore No fetch in global.
            global.fetch = fetch;
        });

        afterEach(() => {
            // @ts-ignore No fetch in global.
            global.fetch = undefined;
        });

        it('load', async () => {
            const loader = new Loader();

            const data = await loader.load('/test-url');
        });
    });
});
