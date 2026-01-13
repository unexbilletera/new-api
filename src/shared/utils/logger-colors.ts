export const Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',

  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
} as const;

export class ColoredLogger {
  static error(prefix: string, message: string, ...args: any[]): void {
    const coloredPrefix = `${Colors.bold}${Colors.brightRed}${prefix}${Colors.reset}`;
    const coloredMessage = `${Colors.red}${message}${Colors.reset}`;
    console.error(coloredPrefix, coloredMessage, ...args);
  }

  static critical(prefix: string, message: string, ...args: any[]): void {
    const coloredPrefix = `${Colors.bold}${Colors.white}${Colors.bgRed}${prefix}${Colors.reset}`;
    const coloredMessage = `${Colors.brightRed}${Colors.bold}${message}${Colors.reset}`;
    console.error(coloredPrefix, coloredMessage, ...args);
  }

  static success(prefix: string, message: string, ...args: any[]): void {
    const coloredPrefix = `${Colors.bold}${Colors.green}${prefix}${Colors.reset}`;
    const coloredMessage = `${Colors.green}${message}${Colors.reset}`;
    console.error(coloredPrefix, coloredMessage, ...args);
  }

  static info(prefix: string, message: string, ...args: any[]): void {
    const coloredPrefix = `${Colors.bold}${Colors.blue}${prefix}${Colors.reset}`;
    const coloredMessage = `${Colors.cyan}${message}${Colors.reset}`;
    console.error(coloredPrefix, coloredMessage, ...args);
  }

  static debug(prefix: string, message: string, ...args: any[]): void {
    const coloredPrefix = `${Colors.dim}${Colors.cyan}${prefix}${Colors.reset}`;
    const coloredMessage = `${Colors.dim}${message}${Colors.reset}`;
    console.error(coloredPrefix, coloredMessage, ...args);
  }

  static errorWithStack(
    prefix: string,
    message: string,
    error?: Error | unknown,
  ): void {
    const coloredPrefix = `${Colors.bold}${Colors.brightRed}${prefix}${Colors.reset}`;
    const coloredMessage = `${Colors.red}${message}${Colors.reset}`;

    console.error(coloredPrefix, coloredMessage);

    if (error instanceof Error) {
      const coloredErrorMsg = `${Colors.dim}${Colors.red}${error.message}${Colors.reset}`;
      console.error(coloredErrorMsg);

      if (error.stack) {
        const coloredStack = `${Colors.dim}${error.stack}${Colors.reset}`;
        console.error(coloredStack);
      }
    } else if (error) {
      const coloredError = `${Colors.dim}${Colors.red}${String(error)}${Colors.reset}`;
      console.error(coloredError);
    }
  }
}
