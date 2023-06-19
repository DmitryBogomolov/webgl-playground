import {findIncludes} from './webpack.shader-loader';

describe('shader-loader', () => {
    it('find includes', () => {
        expect(findIncludes('')).toEqual([]);
        expect(findIncludes('Hello')).toEqual([]);
        expect(findIncludes('//#include test.txt')).toEqual([{ line: 0, path: 'test.txt' }]);
        expect(findIncludes('//#include test.txt  ')).toEqual([{ line: 0, path: 'test.txt' }]);
        expect(findIncludes('//#include test.txt  // comment ')).toEqual([{ line: 0, path: 'test.txt' }]);

        expect(findIncludes('Hello\n\n//#include test.txt\n')).toEqual([
            { line: 2, path: 'test.txt' },
        ]);
        expect(findIncludes('Hello\n//#include test-1.txt\n//#include test-2.txt\nWorld')).toEqual([
            { line: 1, path: 'test-1.txt' },
            { line: 2, path: 'test-2.txt' },
        ]);
    });
});
