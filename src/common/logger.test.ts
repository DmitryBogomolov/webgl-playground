import { LoggerImpl } from './logger';

describe('logger', () => {
    describe('LoggerImpl', () => {
        it('info', () => {
            const info = jest.fn();
            const tmp = new LoggerImpl('');
            Object.assign(tmp, { _driver: { info } });
            const logger = new LoggerImpl('test-logger', tmp);

            expect(logger.info('Hello World')).toEqual('[test-logger]: Hello World');
            expect(logger.info('Hello {0} {1}', 1, 'test')).toEqual('[test-logger]: Hello 1 test');
            expect(info.mock.calls).toEqual([
                ['[test-logger]: Hello World'],
                ['[test-logger]: Hello 1 test'],
            ]);
        });

        it('warn', () => {
            const warn = jest.fn();
            const tmp = new LoggerImpl('');
            Object.assign(tmp, { _driver: { warn } });
            const logger = new LoggerImpl('test-logger', tmp);

            expect(logger.warn('Hello World')).toEqual('[test-logger]: Hello World');
            expect(logger.warn('Hello {0} {1}', 1, 'test')).toEqual('[test-logger]: Hello 1 test');
            expect(warn.mock.calls).toEqual([
                ['[test-logger]: Hello World'],
                ['[test-logger]: Hello 1 test'],
            ]);
        });

        it('error', () => {
            const error = jest.fn();
            const tmp = new LoggerImpl('');
            Object.assign(tmp, { _driver: { error } });
            const logger = new LoggerImpl('test-logger', tmp);

            expect(() => logger.error('Hello World')).toThrow('[test-logger]: Hello World');
            expect(() => logger.error('Hello {0} {1}', 1, 'test')).toThrow('[test-logger]: Hello 1 test');
            expect(error.mock.calls).toEqual([
                ['[test-logger]: Hello World'],
                ['[test-logger]: Hello 1 test'],
            ]);
        });
    });
});
