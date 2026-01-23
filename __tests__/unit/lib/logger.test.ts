import { logger } from '@/lib/logger';

describe('lib/logger', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('should log info messages in correct JSON format', () => {
        logger.info('Test info', { foo: 'bar' });

        expect(consoleLogSpy).toHaveBeenCalledWith(
            JSON.stringify({
                timestamp: '2024-01-01T00:00:00.000Z',
                level: 'info',
                message: 'Test info',
                context: { foo: 'bar' }
            })
        );
    });

    it('should log error messages with stack traces', () => {
        const error = new Error('Something went wrong');
        error.stack = 'Error stack trace';

        logger.error('Test error', error, { userId: 123 });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            JSON.stringify({
                timestamp: '2024-01-01T00:00:00.000Z',
                level: 'error',
                message: 'Test error',
                context: { userId: 123 },
                error: 'Something went wrong',
                stack: 'Error stack trace'
            })
        );
    });
});
