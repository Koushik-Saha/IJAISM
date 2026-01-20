/**
 * Structured Logger for C5K Platform
 * 
 * Provides consistent JSON-formatted logging for observability.
 * Use this instead of console.log/error/warn.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: string;
    stack?: string;
}

class Logger {
    private format(level: LogLevel, message: string, context?: Record<string, any>, error?: Error | unknown): string {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
        };

        if (error) {
            if (error instanceof Error) {
                entry.error = error.message;
                entry.stack = error.stack;
            } else {
                entry.error = String(error);
            }
        }

        return JSON.stringify(entry);
    }

    info(message: string, context?: Record<string, any>) {
        console.log(this.format('info', message, context));
    }

    warn(message: string, context?: Record<string, any>) {
        console.warn(this.format('warn', message, context));
    }

    error(message: string, error?: Error | unknown, context?: Record<string, any>) {
        console.error(this.format('error', message, context, error));
    }

    debug(message: string, context?: Record<string, any>) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(this.format('debug', message, context));
        }
    }
}

export const logger = new Logger();
