import * as content from './index';

describe('index', () => {
    test('non empty entries', () => {
        Object.keys(content).forEach((key) => {
            // @ts-expect-error Check that value is defined.
            expect(content[key]).toBeDefined();
        });
    });
});
