import * as content from './index';

describe('index', () => {
    test('non empty entries', () => {
        Object.keys(content).forEach((key) => {
            // @ts-ignore Check that value is defined.
            expect(content[key]).toBeDefined();
        });
    });
});
