/**
 * @file logger.helper.ts
 * @description Semantic logger for integration tests with structured output
 */

/**
 * Log levels for integration tests
 */
export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  STEP = 'STEP',
}

/**
 * Logger for integration tests
 * Provides semantic logging with structured output
 */
export class IntegrationTestLogger {
  private readonly context: string;

  /**
   * Creates a new logger instance
   * @param context - Context identifier for log messages
   */
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Logs an informational message
   * @param message - Log message
   * @param data - Optional structured data
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs a success message
   * @param message - Log message
   * @param data - Optional structured data
   */
  success(message: string, data?: any): void {
    this.log(LogLevel.SUCCESS, message, data);
  }

  /**
   * Logs a warning message
   * @param message - Log message
   * @param data - Optional structured data
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Logs an error message
   * @param message - Log message
   * @param data - Optional structured data
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Logs a debug message
   * @param message - Log message
   * @param data - Optional structured data
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Logs a test step
   * @param stepNumber - Step number in sequence
   * @param stepName - Description of the step
   */
  step(stepNumber: number, stepName: string): void {
    const timestamp = this.formatTimestamp();
    console.log(`[${timestamp}] [STEP ${stepNumber}] [${this.context}] ${stepName}`);
  }

  /**
   * Marks the start of a test
   * @param testName - Name of the test
   */
  testStart(testName: string): void {
    const timestamp = this.formatTimestamp();
    console.log(`\n[${timestamp}] [TEST START] [${this.context}] ${testName}`);
  }

  /**
   * Marks the end of a test
   * @param testName - Name of the test
   */
  testEnd(testName: string): void {
    const timestamp = this.formatTimestamp();
    console.log(`[${timestamp}] [TEST END] [${this.context}] ${testName}\n`);
  }

  /**
   * Formats timestamp in ISO format
   * @returns Formatted timestamp string
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Internal log method
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional structured data
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = this.formatTimestamp();
    const formattedData = data ? ` ${JSON.stringify(data)}` : '';
    const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}${formattedData}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}

/**
 * Factory function to create logger instances
 * @param context - Context identifier for the logger
 * @returns New logger instance
 */
export const createIntegrationLogger = (context: string): IntegrationTestLogger => {
  return new IntegrationTestLogger(context);
};
