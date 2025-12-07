import { describe, expect, jest, test } from '@jest/globals';
import processShader from './shader-loader';
import fs from 'fs/promises';

jest.mock('fs/promises');

describe('shader-loader', () => {
    afterEach(() => {
        (fs.readFile as jest.Mock).mockReset();
    });

    function setDebugSources(sources: Record<string, string>): void {
        (fs.readFile as jest.Mock).mockImplementation((name: unknown) => {
            const source = sources[name as string];
            return source ? Promise.resolve(source) : Promise.reject(new Error(`not found: ${name}`));
        });
    }

    interface LoaderResult {
        readonly lines: ReadonlyArray<string>;
        readonly dependencies: ReadonlyArray<string>;
    }

    async function invokeLoader(resourcePath: string, source: string): Promise<LoaderResult> {
        const dependencies: string[] = [];
        function addDependency(file: string): void {
            dependencies.push(file);
        }
        // @ts-ignore Test setup.
        const content: string = await processShader.call({ resourcePath, addDependency }, source);
        const code = content.substring('export default '.length);
        const lines = (JSON.parse(code) as string).split('\n');
        return { lines, dependencies };
    }

    test('simple sources', async () => {
        {
            const { lines, dependencies } = await invokeLoader('/some/file-1.txt', '');

            expect(dependencies).toEqual(['/some/file-1.txt']);
            expect(lines).toEqual(['']);
        }
        {
            const { lines, dependencies } = await invokeLoader('/some/file-1.txt', 'Hello World');

            expect(dependencies).toEqual(['/some/file-1.txt']);
            expect(lines).toEqual(['Hello World']);
        }
        {
            const { lines, dependencies } = await invokeLoader('/some/file-1.txt', 'Hello World\n');

            expect(dependencies).toEqual(['/some/file-1.txt']);
            expect(lines).toEqual(['Hello World', '']);
        }
        {
            const { lines, dependencies } = await invokeLoader('/some/file-2.txt', 'Hello World\n\nLine 1\nLine 2\n');

            expect(dependencies).toEqual(['/some/file-2.txt']);
            expect(lines).toEqual(['Hello World', '', 'Line 1', 'Line 2', '']);
        }
        {
            const { lines, dependencies } = await invokeLoader(
                '/some/file-3.txt',
                'Hello World\n\nLine 1\nLine 2\n\nLine 3\n\n',
            );

            expect(dependencies).toEqual(['/some/file-3.txt']);
            expect(lines).toEqual(['Hello World', '', 'Line 1', 'Line 2', '', 'Line 3', '', '']);
        }
    });

    test('simple includes', async () => {
        setDebugSources({
            ['/some/file-2.txt']: 'File 2\nHello - File 2',
            ['/some/file-3.txt']: 'File 3\nHello - File 3\n',
        });

        {
            const { lines, dependencies } = await invokeLoader(
                '/some/file-1.txt',
                [
                    'File 1',
                    '#include "./file-2.txt"',
                    'Hello - File 1',
                    '',
                ].join('\n'),
            );

            expect(dependencies).toEqual(['/some/file-1.txt', '/some/file-2.txt']);
            expect(lines).toEqual([
                'File 1',
                '#line 1 1 // /some/file-2.txt',
                'File 2',
                'Hello - File 2',
                '#line 3 0 // /some/file-1.txt',
                'Hello - File 1',
                '',
            ]);
        }
        {
            const { lines, dependencies } = await invokeLoader(
                '/some/file-1.txt',
                [
                    'File 1',
                    '#include "./file-3.txt"',
                    'Hello - File 1',
                    '',
                ].join('\n'),
            );

            expect(dependencies).toEqual(['/some/file-1.txt', '/some/file-3.txt']);
            expect(lines).toEqual([
                'File 1',
                '#line 1 1 // /some/file-3.txt',
                'File 3',
                'Hello - File 3',
                '',
                '#line 3 0 // /some/file-1.txt',
                'Hello - File 1',
                '',
            ]);
        }
        {
            const { lines, dependencies } = await invokeLoader(
                '/some/file-1.txt',
                [
                    'File 1',
                    '#include "./file-2.txt"',
                    'Hello - File 1 (1)',
                    '#include "./file-3.txt"',
                    'Hello - File 1 (2)',
                    '',
                ].join('\n'),
            );

            expect(dependencies).toEqual(['/some/file-1.txt', '/some/file-2.txt', '/some/file-3.txt']);
            expect(lines).toEqual([
                'File 1',
                '#line 1 1 // /some/file-2.txt',
                'File 2',
                'Hello - File 2',
                '#line 3 0 // /some/file-1.txt',
                'Hello - File 1 (1)',
                '#line 1 2 // /some/file-3.txt',
                'File 3',
                'Hello - File 3',
                '',
                '#line 5 0 // /some/file-1.txt',
                'Hello - File 1 (2)',
                '',
            ]);
        }
    });

    test('duplicate includes', async () => {
        setDebugSources({
            ['/some/file-2.txt']: 'File 2\nHello - File 2',
        });

        const { lines, dependencies } = await invokeLoader(
            '/some/file-1.txt',
            [
                'File 1',
                '#include ./file-2.txt',
                'Hello - File 1 (1)',
                '#include ./file-2.txt',
                'Hello - File 1 (2)',
                '',
            ].join('\n'),
        );

        expect(dependencies).toEqual(['/some/file-1.txt', '/some/file-2.txt']);
        expect(lines).toEqual([
            '#line 1 0',
            'File 1',
            '#line 1 1',
            'File 2',
            'Hello - File 2',
            '#line 3 0',
            'Hello - File 1 (1)',
            '#line 1 1',
            'File 2',
            'Hello - File 2',
            '#line 5 0',
            'Hello - File 1 (2)',
            '',
            '// SOURCES_MAPPING',
            '// 0 /some/file-1.txt',
            '// 1 /some/file-2.txt',
            '',
        ]);
    });

    test('nested includes', async () => {
        setDebugSources({
            ['/some/dir/file-2.txt']: 'File 2\n#include ./sub/file-3.txt\n#include ./sub/file-4.txt\nHello - File 2\n',
            ['/some/dir/sub/file-3.txt']: 'File 3\nHello - File 3\n',
            ['/some/dir/sub/file-4.txt']: 'File 4\nHello - File 4\n',
        });

        const { lines, dependencies } = await invokeLoader(
            '/some/dir/file-1.txt',
            [
                'File 1',
                '',
                '#include ./file-2.txt',
                'Hello - File 1',
                '',
            ].join('\n'),
        );

        expect(dependencies).toEqual([
            '/some/dir/file-1.txt',
            '/some/dir/file-2.txt',
            '/some/dir/sub/file-3.txt',
            '/some/dir/sub/file-4.txt',
        ]);
        expect(lines).toEqual([
            '#line 1 0',
            'File 1',
            '',
            '#line 1 1',
            'File 2',
            '#line 1 2',
            'File 3',
            'Hello - File 3',
            '#line 3 1',
            '#line 1 3',
            'File 4',
            'Hello - File 4',
            '#line 4 1',
            'Hello - File 2',
            '#line 4 0',
            'Hello - File 1',
            '',
            '// SOURCES_MAPPING',
            '// 0 /some/dir/file-1.txt',
            '// 1 /some/dir/file-2.txt',
            '// 2 /some/dir/sub/file-3.txt',
            '// 3 /some/dir/sub/file-4.txt',
            '',
        ]);
    });
});

// TOOO:
// not at start line
// not absolute
// duplicates
// duplicates - ok
