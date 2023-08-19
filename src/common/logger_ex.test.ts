import type { LogEntry, LogTransport } from './logger_ex.types';
import { LoggerImpl, ConsoleLogTransport } from './logger_ex';

describe('logger', () => {
    describe('LoggerImpl', () => {
        let logger: LoggerImpl;
        let log: jest.SpyInstance;

        beforeEach(() => {
            logger = new LoggerImpl();
            log = jest.fn();
            logger.addTransport({ log } as unknown as LogTransport);
        });

        it('info', () => {
            logger.info('test message');

            expect(log).toBeCalledWith<[LogEntry]>({
                level: 'info', message: 'test message', timestamp: expect.any(Date),
            });
        });

        it('warn', () => {
            logger.warn('test message');

            expect(log).toBeCalledWith<[LogEntry]>({
                level: 'warn', message: 'test message', timestamp: expect.any(Date),
            });
        });

        it('error', () => {
            logger.error('test message');

            expect(log).toBeCalledWith<[LogEntry]>({
                level: 'error', message: 'test message', timestamp: expect.any(Date),
            });
        });

        it('add transport', () => {
            const stub1 = jest.fn();
            const stub2 = jest.fn();
            logger.addTransport({ log: stub1 } as unknown as LogTransport);
            logger.addTransport({ log: stub2 } as unknown as LogTransport);

            logger.info('test');

            expect(stub1).toBeCalledWith<[LogEntry]>({
                level: 'info', message: 'test', timestamp: expect.any(Date),
            });
            expect(stub2).toBeCalledWith<[LogEntry]>({
                level: 'info', message: 'test', timestamp: expect.any(Date),
            });
        });

        it('remove transport', () => {
            const stub1 = jest.fn();
            const stub2 = jest.fn();
            const transport1 = { log: stub1 } as unknown as LogTransport;
            const transport2 = { log: stub2 } as unknown as LogTransport;
            logger.addTransport(transport1);
            logger.addTransport(transport2);

            logger.info('test 1');
            logger.removeTransport(transport2);
            logger.info('test 2');
            logger.removeTransport(transport1);
            logger.info('test 3');

            expect(stub1).toHaveBeenCalledTimes(2);
            expect(stub2).toHaveBeenCalledTimes(1);
        });
    });

    describe('ConsoleLogTransport', () => {
        let log: jest.SpyInstance;
        let warn: jest.SpyInstance;
        let error: jest.SpyInstance;

        let transport: ConsoleLogTransport;

        beforeEach(() => {
            transport = new ConsoleLogTransport();
            log = jest.spyOn(console, 'log');
            warn = jest.spyOn(console, 'warn');
            error = jest.spyOn(console, 'error');
        });

        afterEach(() => {
            log.mockReset();
            warn.mockReset();
            error.mockReset();
        });

        it('info', () => {
            const date = new Date();
            transport.log({ level: 'info', message: 'test', timestamp: date });

            expect(log).toHaveBeenCalledWith('test');
        });

        it('warn', () => {
            const date = new Date();
            transport.log({ level: 'warn', message: 'test', timestamp: date });

            expect(warn).toHaveBeenCalledWith('test');
        });

        it('error', () => {
            const date = new Date();
            transport.log({ level: 'error', message: 'test', timestamp: date });

            expect(error).toHaveBeenCalledWith('test');
        });
    });
});
