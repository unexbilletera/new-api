import { Injectable } from '@nestjs/common';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: Error;
  timestamp?: string;
}

@Injectable()
export class LoggerService {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(context: LogContext): string {
    const timestamp = context.timestamp || this.formatTimestamp();
    const prefix = `[${timestamp}] [${context.level}]`;
    let message = `${prefix} ${context.message}`;

    if (context.data && Object.keys(context.data).length > 0) {
      message += ` ${JSON.stringify(context.data)}`;
    }

    if (context.error) {
      message += `\n${context.error.stack || context.error.message}`;
    }

    return message;
  }

  private output(context: LogContext): void {
    const formattedLog = this.formatLog(context);

    switch (context.level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, data?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.output({
        level: LogLevel.DEBUG,
        message,
        data,
      });
    }
  }

  info(message: string, data?: Record<string, any>): void {
    this.output({
      level: LogLevel.INFO,
      message,
      data,
    });
  }

  warn(message: string, data?: Record<string, any>): void {
    this.output({
      level: LogLevel.WARN,
      message,
      data,
    });
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.output({
      level: LogLevel.ERROR,
      message,
      error,
      data,
    });
  }
}