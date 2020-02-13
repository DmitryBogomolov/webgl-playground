const { getOutputName, getBundleRoute, prettifyName } = require('./utils');

describe('utils', () => {
    describe('getOutputName', () => {
        it('build output name', () => {
            expect(getOutputName('test-module')).toEqual('test-module.bundle.js');
            expect(getOutputName('test.module')).toEqual('test.module.bundle.js');
        });
    });

    describe('prettifyName', () => {
        it('prettify name', () => {
            expect(prettifyName('1_test-module')).toEqual('test-module');
            expect(prettifyName('2_test_module')).toEqual('test module');
        });
    });
});
