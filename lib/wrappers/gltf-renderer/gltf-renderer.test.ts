import type { Logger } from '../../common/logger.types';
import type { Runtime } from '../../gl/runtime';
import { GlTFRenderer } from './gltf-renderer';
import { Loader } from '../../common/loader';

jest.mock('../../common/loader');

describe('gltf-renderer', () => {
    describe('GlTFRenderer', () => {
        const MockLoader = Loader as jest.Mock<Loader>;

        class StubLogger implements Logger {
            log(): string {
                return '';
            }
            warn(): string {
                return '';
            }
            error(): Error {
                return new Error('');
            }
        }
        const stubLogger = new StubLogger();

        let renderer: GlTFRenderer;
        let runtime: Runtime;
        let loader: Loader;

        beforeEach(() => {
            runtime = {
                id: () => 'stub/runtime',
                logger: () => stubLogger,
            } as Pick<Runtime, 'id' | 'logger'> as Runtime;
            renderer = new GlTFRenderer(runtime, 'tag/test');
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
