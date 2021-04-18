import * as content from './index';

describe('index', () => {
    test('non empty entries', () => {
        Object.keys(content).forEach((key) => {
            expect(content[key]).toBeDefined();
        });
    }); 
});
