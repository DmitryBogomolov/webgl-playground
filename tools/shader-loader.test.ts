import {findIncludes, traverseSource, buildCombinedSource, SourceInfo, IncludeInfo} from './shader-loader';
import fs from 'fs/promises';

jest.mock('fs/promises');

describe('shader-loader', () => {
    afterEach(() => {
        (fs.readFile as jest.Mock).mockReset();
    });

    function setDebugSources(sources: Readonly<Record<string, string>>): void {
        (fs.readFile as jest.Mock).mockImplementation((name: string) => {
            const source = sources[name];
            return source ? Promise.resolve(source) : Promise.reject(new Error(`not found: ${name}`));
        });
    }

    it('find includes', () => {
        expect(findIncludes('')).toEqual([]);
        expect(findIncludes('Hello')).toEqual([]);
        expect(findIncludes('//#include test.txt')).toEqual([{ line: 0, path: 'test.txt', start: 0, end: 19 }]);
        expect(findIncludes('//#include test.txt\n')).toEqual([{ line: 0, path: 'test.txt', start: 0, end: 19 }]);
        expect(findIncludes('//#include test.txt  ')).toEqual([{ line: 0, path: 'test.txt', start: 0, end: 21 }]);
        expect(findIncludes('//#include test.txt  \n')).toEqual([{ line: 0, path: 'test.txt', start: 0, end: 21 }]);
        // expect(findIncludes('//#include test.txt  // comment ')).toEqual([{ line: 0, path: 'test.txt', start: 0, end: 32 }]);

        expect(findIncludes('Hello\n\n//#include test.txt\n')).toEqual<IncludeInfo[]>([
            { line: 2, path: 'test.txt', start: 7, end: 26 },
        ]);
        expect(findIncludes('Hello\n//#include test-1.txt\n//#include test-2.txt\nWorld')).toEqual<IncludeInfo[]>([
            { line: 1, path: 'test-1.txt', start: 6, end: 27 },
            { line: 2, path: 'test-2.txt', start: 28, end: 49 },
        ]);
    });

    it('traverseSource', async () => {
        {
            const result = new Map<string, SourceInfo>();
            await traverseSource('Hello', '/some/dir/file-1.txt', result);

            expect(result).toEqual(new Map<string, SourceInfo>([
                [
                    '/some/dir/file-1.txt',
                    { id: 0, path: '/some/dir/file-1.txt', source: 'Hello\n', includes: [] },
                ]
            ]));
        }
        {
            const result = new Map<string, SourceInfo>();
            await traverseSource('Hello World\n', '/some/dir/file-1.txt', result);

            expect(result).toEqual(new Map<string, SourceInfo>([
                [
                    '/some/dir/file-1.txt',
                    { id: 0, path: '/some/dir/file-1.txt', source: 'Hello World\n', includes: [] },
                ]
            ]));
        }
    });

    it('traverseSource complex', async () => {
        const path1 = '/some/dir/file-1.txt';
        const path2 = '/some/dir/file-2.txt';
        const path3 = '/some/dir/sub/file-3.txt';
        const path4 = '/some/dir/sub/file-4.txt';
        const source1 = 'File 1\n\n//#include ./file-2.txt\n\nHello World 1\n';
        const source2 = 'File 2\n//#include ./sub/file-3.txt\n//#include ./sub/file-4.txt\nHello World 2\n';
        const source3 = 'File 3\nHello World 3\n';
        const source4 = 'File 4\nHello World 4\n';
        setDebugSources({
            [path2]: source2,
            [path3]: source3,
            [path4]: source4,
        });

        {
            const result = new Map<string, SourceInfo>();
            await traverseSource(source3, path3, result);
            expect(result).toEqual(new Map<string, SourceInfo>([
                [
                    path3,
                    { id: 0, path: path3, source: source3, includes: [] },
                ]
            ]));
        }
        {
            const result = new Map<string, SourceInfo>();
            await traverseSource(source4, path4, result);
            expect(result).toEqual(new Map<string, SourceInfo>([
                [
                    path4,
                    { id: 0, path: path4, source: source4, includes: [] },
                ]
            ]));
        }
        {
            const result = new Map<string, SourceInfo>();
            await traverseSource(source2, path2, result);
            expect(result).toEqual(new Map<string, SourceInfo>([
                [
                    path2,
                    {
                        id: 0, path: path2, source: source2,
                        includes: [
                            { line: 1, path: path3, start: 7, end: 34 },
                            { line: 2, path: path4, start: 35, end: 62 },
                        ]
                    },
                ],
                [
                    path3,
                    { id: 1, path: path3, source: source3, includes: [] },
                ],
                [
                    path4,
                    { id: 2, path: path4, source: source4, includes: [] },
                ]
            ]));
        }
        {
            const result = new Map<string, SourceInfo>();
            await traverseSource(source1, path1, result);
            expect(result).toEqual(new Map<string, SourceInfo>([
                [
                    path1,
                    {
                        id: 0, path: path1, source: source1,
                        includes: [
                            { line: 2, path: path2, start: 8, end: 31 },
                        ]
                    }
                ],
                [
                    path2,
                    {
                        id: 1, path: path2, source: source2,
                        includes: [
                            { line: 1, path: path3, start: 7, end: 34 },
                            { line: 2, path: path4, start: 35, end: 62 },
                        ]
                    },
                ],
                [
                    path3,
                    { id: 2, path: path3, source: source3, includes: [] },
                ],
                [
                    path4,
                    { id: 3, path: path4, source: source4, includes: [] },
                ]
            ]));
        }
    });

    it('buildCombinedSource', () => {
        const path1 = '/some/dir/file-1.txt';
        const path2 = '/some/dir/file-2.txt';
        const path3 = '/some/dir/sub/file-3.txt';
        const path4 = '/some/dir/sub/file-4.txt';
        const source1 = 'File 1\n\n//#include ./file-2.txt\n\nHello World 1\n';
        const source2 = 'File 2\n//#include ./sub/file-3.txt\n//#include ./sub/file-4.txt\nHello World 2\n';
        const source3 = 'File 3\nHello World 3\n';
        const source4 = 'File 4\nHello World 4\n';

        const sources = new Map<string, SourceInfo>([
            [
                path1,
                {
                    id: 0, path: path1, source: source1,
                    includes: [{ line: 2, path: path2, start: 8, end: 31 }]
                }
            ],
            [
                path2,
                {
                    id: 1, path: path2, source: source2,
                    includes: [
                        { line: 1, path: path3, start: 7, end: 34 },
                        { line: 2, path: path4, start: 35, end: 62 },
                    ]
                }
            ],
            [   path3,
                { id: 2, path: path3, source: source3, includes: [] }
            ],
            [
                path4,
                { id: 3, path: path4, source: source4, includes: [] }
            ],
        ]);

        expect(buildCombinedSource(path3, sources)).toEqual('#line 1 2\n' + source3);
        expect(buildCombinedSource(path4, sources)).toEqual('#line 1 3\n' + source4);
        expect(buildCombinedSource(path2, sources)).toEqual([
            '#line 1 1',
            'File 2',
            '#line 1 2',
            'File 3',
            'Hello World 3',
            '#line 3 1',
            '#line 1 3',
            'File 4',
            'Hello World 4',
            '#line 4 1',
            'Hello World 2',
            '',
            '// SOURCES_MAPPING',
            '// 1 /some/dir/file-2.txt',
            '// 2 /some/dir/sub/file-3.txt',
            '// 3 /some/dir/sub/file-4.txt',
            '',
        ].join('\n'));
        expect(buildCombinedSource(path1, sources)).toEqual([
            '#line 1 0',
            'File 1',
            '',
            '#line 1 1',
            'File 2',
            '#line 1 2',
            'File 3',
            'Hello World 3',
            '#line 3 1',
            '#line 1 3',
            'File 4',
            'Hello World 4',
            '#line 4 1',
            'Hello World 2',
            '#line 4 0',
            '',
            'Hello World 1',
            '',
            '// SOURCES_MAPPING',
            '// 0 /some/dir/file-1.txt',
            '// 1 /some/dir/file-2.txt',
            '// 2 /some/dir/sub/file-3.txt',
            '// 3 /some/dir/sub/file-4.txt',
            '',
        ].join('\n'));
    });
});
