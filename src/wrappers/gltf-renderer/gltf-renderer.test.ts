import type { Runtime } from '../../gl/runtime';
import type { Logger } from '../../common/logger.types';
import { GlTFRenderer } from './gltf-renderer';
import { Loader } from '../../common/loader';

jest.mock('../../common/loader');

describe('gltf-renderer', () => {
    describe('GlTFRenderer', () => {
        const MockLoader = Loader as jest.Mock<Loader>;

        let renderer: GlTFRenderer;
        let runtime: Runtime;
        let loader: Loader;

        beforeEach(() => {
            runtime = {
                logger: {} as Logger,
            } as Pick<Runtime, 'logger'> as Runtime;
            renderer = new GlTFRenderer({ runtime, tag: 'tag/test' });
            loader = MockLoader.mock.instances[0];
        });

        afterEach(() => {
            MockLoader.mockReset();
        });

        it('create instance', () => {
            expect(MockLoader).toBeCalledWith();
        });

        it('destroy instance', () => {
            renderer.dispose();

            expect(loader.dispose).toBeCalledWith();
        });
    });
});
