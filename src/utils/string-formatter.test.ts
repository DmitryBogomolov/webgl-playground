import { formatStr } from './string-formatter';

describe('string-formatter', () => {
    describe('formatStr', () => {
        function check(template: string, params: unknown[], expected: string): void {
            expect(formatStr(template, ...params)).toEqual(expected);
        }

        it('support no params', () => {
            check('hello', ['A'], 'hello');
        });

        it('support simple types', () => {
            check('hello {0}', ['A'], 'hello A');
            check('hello {0}', [1], 'hello 1');
            check('hello {0}', [true], 'hello true');
            check('hello {0}', [false], 'hello false');
            check('hello {0}', [null], 'hello null');
            check('hello {0}', [undefined], 'hello undefined');
        });

        it('support positions', () => {
            check('hello {0} {1}', ['A', 'B'], 'hello A B');
            check('hello {1} {0}', ['A', 'B'], 'hello B A');
            check('hello {0} {0}', ['A', 'B'], 'hello A A');
            check('hello {1} {1}', ['A', 'B'], 'hello B B');
        });

        it('support complex types', () => {
            check('hello {0}', [[1, 2, 3]], 'hello [1,2,3]');
            check('hello {0}', [{ a: 1, b: 2 }], 'hello {"a":1,"b":2}');
            check('hello {0}', [Symbol('1')], 'hello Symbol(1)');
        });
    });
});
