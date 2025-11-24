/**
 * Production-ready logging utility
 * Provides structured logging with different levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  userId?: string;
  familyId?: string;
  sessionId?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(level: LogLevel = LogLevel.INFO, context: LogContext = {}) {
    this.level = level;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    const contextStr = Object.keys(mergedContext).length > 0
      ? ` ${JSON.stringify(mergedContext)}`
      : '';

    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, levelName: string, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelName, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // In production, also send to monitoring service
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      // Send to monitoring service (Sentry, DataDog, etc.)
      // This would be configured based on your monitoring setup
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, 'WARN', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } : context;

    this.log(LogLevel.ERROR, 'ERROR', message, errorContext);
  }

  // Create a child logger with additional context
  child(context: LogContext): Logger {
    return new Logger(this.level, { ...this.context, ...context });
  }

  // Set logging level
  setLevel(level: LogLevel) {
    this.level = level;
  }
}

// Create default logger instance
const defaultLogger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// Export singleton logger
export const logger = defaultLogger;

// Export Logger class for custom instances
export { Logger };
export type { LogContext };

// Convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
};