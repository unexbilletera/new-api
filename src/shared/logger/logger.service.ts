import { Injectable } from '@nestjs/common';
import { Colors } from '../utils/logger-colors';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  level: LogLevel;
  message: string;
  prefix?: string;
  data?: Record<string, any>;
  error?: Error;
  timestamp?: string;
  args?: any[];
}

@Injectable()
export class LoggerService {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private useColors = this.isDevelopment;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(context: LogContext): string {
    const timestamp = context.timestamp || this.formatTimestamp();
    const levelLabel = this.formatLevelLabel(context.level);
    const basePrefix = `[${timestamp}] [${levelLabel}]`;
    const prefixPart = context.prefix
      ? ` ${this.formatPrefix(context.prefix, context.level)}`
      : '';
    let message = `${basePrefix}${prefixPart} ${this.formatMessage(context.message, context.level)}`;

    if (context.data && Object.keys(context.data).length > 0) {
      message += ` ${JSON.stringify(context.data)}`;
    }

    if (context.args && context.args.length > 0) {
      const formattedArgs = context.args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      message += ` ${formattedArgs}`;
    }

    if (context.error) {
      const stack = context.error.stack || context.error.message;
      message += `\n${this.formatStack(stack)}`;
    }

    return message;
  }

  private formatStack(stack: string): string {
    if (!this.useColors) return stack;
    return `${Colors.dim}${stack}${Colors.reset}`;
  }

  private formatPrefix(prefix: string, level: LogLevel): string {
    if (!this.useColors) return prefix;
    const color = this.levelColor(level);
    return `${Colors.bold}${color}${prefix}${Colors.reset}`;
  }

  private formatMessage(message: string, level: LogLevel): string {
    if (!this.useColors) return message;
    const color = this.levelColor(level, true);
    return `${color}${message}${Colors.reset}`;
  }

  private formatLevelLabel(level: LogLevel): string {
    if (!this.useColors) return level;
    const color = this.levelColor(level);
    return `${color}${level}${Colors.reset}`;
  }

  private levelColor(level: LogLevel, isMessage = false): string {
    switch (level) {
      case LogLevel.DEBUG:
        return isMessage ? Colors.dim : Colors.cyan;
      case LogLevel.INFO:
        return Colors.cyan;
      case LogLevel.SUCCESS:
        return Colors.green;
      case LogLevel.WARN:
        return Colors.yellow;
      case LogLevel.ERROR:
        return Colors.red;
      default:
        return '';
    }
  }

  private output(context: LogContext): void {
    const formattedLog = this.formatLog(context);

    switch (context.level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
      case LogLevel.SUCCESS:
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

  private normalizeMessage(
    prefixOrMessage: string,
    messageOrData?: string | Record<string, any>,
    ...args: any[]
  ): {
    prefix?: string;
    message: string;
    data?: Record<string, any>;
    args?: any[];
  } {
    if (typeof messageOrData === 'string') {
      return { prefix: prefixOrMessage, message: messageOrData, args };
    }
    return { message: prefixOrMessage, data: messageOrData, args };
  }

  debug(message: string, data?: Record<string, any>): void;
  debug(prefix: string, message: string, ...args: any[]): void;
  debug(prefixOrMessage: string, messageOrData?: any, ...args: any[]): void {
    if (this.isDevelopment) {
      const normalized = this.normalizeMessage(
        prefixOrMessage,
        messageOrData,
        ...args,
      );
      this.output({
        level: LogLevel.DEBUG,
        ...normalized,
      });
    }
  }

  info(message: string, data?: Record<string, any>): void;
  info(prefix: string, message: string, ...args: any[]): void;
  info(prefixOrMessage: string, messageOrData?: any, ...args: any[]): void {
    const normalized = this.normalizeMessage(
      prefixOrMessage,
      messageOrData,
      ...args,
    );
    this.output({
      level: LogLevel.INFO,
      ...normalized,
    });
  }

  success(message: string, data?: Record<string, any>): void;
  success(prefix: string, message: string, ...args: any[]): void;
  success(prefixOrMessage: string, messageOrData?: any, ...args: any[]): void {
    const normalized = this.normalizeMessage(
      prefixOrMessage,
      messageOrData,
      ...args,
    );
    this.output({
      level: LogLevel.SUCCESS,
      ...normalized,
    });
  }

  warn(message: string, data?: Record<string, any>): void;
  warn(prefix: string, message: string, ...args: any[]): void;
  warn(prefixOrMessage: string, messageOrData?: any, ...args: any[]): void {
    const normalized = this.normalizeMessage(
      prefixOrMessage,
      messageOrData,
      ...args,
    );
    this.output({
      level: LogLevel.WARN,
      ...normalized,
    });
  }

  error(message: string, error?: Error, data?: Record<string, any>): void;
  error(prefix: string, message: string, error?: Error, ...args: any[]): void;
  error(
    prefixOrMessage: string,
    messageOrError?: any,
    errorOrData?: any,
    ...args: any[]
  ): void {
    const normalized = this.normalizeMessage(
      prefixOrMessage,
      messageOrError as any,
      errorOrData,
      ...args,
    );
    const error =
      messageOrError instanceof Error
        ? messageOrError
        : errorOrData instanceof Error
          ? errorOrData
          : undefined;

    this.output({
      level: LogLevel.ERROR,
      ...normalized,
      error,
    });
  }

  errorWithStack(message: string, error?: Error): void;
  errorWithStack(prefix: string, message: string, error?: Error): void;
  errorWithStack(
    prefixOrMessage: string,
    messageOrError?: any,
    errorMaybe?: Error,
  ): void {
    const hasPrefix = typeof messageOrError === 'string';
    const message = hasPrefix ? (messageOrError as string) : prefixOrMessage;
    const prefix = hasPrefix ? prefixOrMessage : undefined;
    const error =
      (hasPrefix ? errorMaybe : messageOrError) instanceof Error
        ? ((hasPrefix ? errorMaybe : messageOrError) as Error)
        : undefined;

    this.output({
      level: LogLevel.ERROR,
      message,
      prefix,
      error,
    });
  }

  critical(prefix: string, message: string, ...args: any[]): void {
    this.output({
      level: LogLevel.ERROR,
      ...this.normalizeMessage(prefix, message, ...args),
    });
  }
}
